$(document).ready(() => {
  const url = new URL(window.location.href);
  const pid = url.searchParams.get('id');
  if (pid) {
    if (pid === 'notes') {
      return showNotes();
    } else if (pid === 'test') {
      return testeLambda();
    }
    return showReservation(pid);
  }
  makeInterface();
});

// beerstrot-prod:
const url = 'https://6nw3zi6sbkph6dledhd4op3mvq0aaduw.lambda-url.eu-central-1.on.aws/';
// const url = 'http://localhost:5001/entry';
function mkCall(type, data, success, error, beforeSend, complete) {
  if (!['POST', 'GET'].includes(type)) return console.log(`this ajax method is not good: ${type}`);
  const set = {
    crossDomain: true,
    url,
    type,
    data,
    success,
    error,
    beforeSend: () => $('#loading').show(),
    complete: () => $('#loading').hide(),
  };
  if (type === 'POST') {
    set.data = JSON.stringify(set.data);
    if (url.split('/').reverse()[0] === 'entry') {
      set.contentType = 'application/json; charset=utf-8';
    }
  }
  $.ajax(set);
}

function testeLambdaPOST () {
  mkCall(
    'POST',
    { action: 'test', data: { hey: 'man', nums: [5, 6, 7], jac: { 33: 44, l: ['asd', 'ewq', 66] } } },
    res => console.log('POST success:', res),
    res => console.log('POST error:', res),
  );
}

function testeLambdaGET () {
  mkCall(
    'GET',
    { action: 'test', data: 'a get arg' },
    res => console.log('GET success:', res),
    res => console.log('GET error:', res),
  );
}

function testeLambda () {
  testeLambdaGET();
  testeLambdaPOST();
}

function showNotes (datetime) {
  $('.form').hide();
  $('#infoDiv').hide();
  $('.clearme').remove();
  const nd = $('#notesDiv').show();
  $('#innerNotesDiv').show();
  mkCall(
    'GET',
    { action: 'notes', data: datetime || '2022-06-13T09:40:41.729Z' },
    res => {
      window.rara = res;
      const r = JSON.parse(res);
      const date = (new Date(r.date)).toLocaleString('it-IT', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});

      jQuery('#from2').datetimepicker({
        startDate: new Date(r.date),
        format:'d/M/Y',
        timepicker: false,
        inline:true,
        onSelectDate: (dp, input) => {
          $('#loading').show();
          showNotes(dp.toISOString());
        },
      }).datetimepicker('show');

      const b = r.bookings;
      const nbookings = b.length;
      if (!nbookings) return showNotesMessage(`nessuna prenotazione per <b>${date}</b>.`);

      let nseggiolini = 0;
      let ncani = 0;
      const notes = [];
      b.forEach((i, ii) => {
        try {
          const n = JSON.parse(i.notes);
          notes.push(n);
          const s = Boolean(n.seggiolini);
          const c = Boolean(n.cani);
          nseggiolini += s;
          ncani += c;
          if (s || c) {
            const tr = $('<tr/>', { class: 'clearme', css: { background: ii % 2 === 0 ? '#fff' : '#ddd' } }).appendTo('#notesTableBody');
            const bc = i.booking_customer;
            $('<td/>').html(bc.first_name + ' ' + bc.last_name).appendTo(tr);
            $('<td/>').html(n.telephone || '').appendTo(tr);
            $('<td/>').html(n.email || '').appendTo(tr);
            $('<td/>').html(new Date(i.booked_for).toLocaleString('it-IT', { hour: '2-digit', minute:'2-digit' })).appendTo(tr);
            $('<td/>', { css: { background: c ? 'rgba(200, 255, 200, 0.5)' : '' } }).html(c ? 'X' : '').appendTo(tr);
            $('<td/>', { css: { background: s ? 'rgba(200, 200, 255, 0.5)' : '' } }).html(s ? 'X' : '').appendTo(tr);
            $('<td/>').html(n.note).appendTo(tr);
          }
        } catch (e) {
          console.log(e, 'not json notes!');
        }
      });
      const summary = `Ci sono <b>${nbookings}</b> le prenotazioni per il giorno <b>${date}</b>, di cui <b>${ncani}</b> con cani e <b>${nseggiolini}</b> con seggiolini.`
      if (nseggiolini + ncani === 0) return showNotesMessage(summary);
      $('<p/>', { class: 'clearme', css: { padding: '2%' } }).html(summary).prependTo('#innerNotesDiv');
    },
    res => {
      $('#loading').hide();
      showMessage(`Si prega di riprovare perché abbiamo riscontrato un errore.
        Se il problema persiste, consigliamo di 
        <a href="https://www.messenger.com/t/397632563730269/" target="_blank">entrare in chat</a>.`);
    }
  );
}

function makeInterface () {
  $('#infoDiv').hide();
  $('<button/>', {
    css: {
      'margin-left': '3%'
    },
    text: 'Prenota',
    tabindex: 7,
    click: () => {
      if (!$('#from').val()) return showMessage('selezionare una data');
      const d = $('#from').datetimepicker('getValue');
      d.setHours(12);
      const data = {
        date: d.toISOString(),
        shiftId: $($('.bShift').filter((i, ii) => $(ii).attr('bselected') == 'true')[0]).attr('bindex'),
        href: window.location.href,
        cani: $('#cani').is(':checked'),
        seggiolini: $('#seggiolini').is(':checked')
      };
      [
        'name',
        'surname',
        'telephone',
        'email',
        'quantity',
        'obs',
      ].forEach(id => { data[id] = $(`#${id}`).val() });

      if (!validateData(data)) return

      mkCall(
        'POST',
        { action: 'mkReservation', data },
        res => {
          const url = window.location.href + '?id=' + res.reservationID2;
          window.location.href = url;
        },
        res => {
          showMessage(`Si prega di riprovare perché abbiamo riscontrato un errore.
            Se il problema persiste, consigliamo di 
            <a href="https://www.messenger.com/t/397632563730269/" target="_blank">entrare in chat</a>
            per effettuare la prenotazione.`);
        }
      );
    }
  }).appendTo('#contentDiv3');

  // https://flatpickr.js.org/ (good alternative)
  // https://xdsoft.net/jqplugins/datetimepicker/ (chosen)
  const disableDates = []; // get from database, given by ADM, TTM
  jQuery('#from').datetimepicker({
    disableDates,
    format:'d/M/Y',
    // minDate: 0, // disabled for tests
    timepicker: false,
    onSelectDate: (dp, input) => {
      $('#loading').show();
      $('#from').chosen = true;
      input.chosenn = true;
      updateShifts(dp);
    },
  });
}

function updateShifts (dp) {
  $('.bShift').remove();
  const data = {
    day: dp.getDate(),
    month: dp.getMonth(),
    year: dp.getYear() + 1900
  };
  let shifts = [];
  mkCall(
    'POST',
    { action: 'getShifts', data },
    res => {
      shifts = mkShiftButtons(res.shifts);
    },
    res => console.log(res, 'the res') // make better error handling TTM
  );
  $('#quantity').on("input", function() {
    const v = Number($(this).val());
    shifts.forEach((s, i) => $('#bShift' + i).prop('disabled', s.table_sizes.filter(s => s >= v).length === 0));
    const totalDisabled = shifts.reduce((c, i, ii) => c + $('#bShift' + ii).prop('disabled'), 0); 
    if (totalDisabled === shifts.length) return showMessage(message10);
    $('#notification').hide();
  });
}

function mkShiftButtons (shifts) {
  const sButtons = [];
  shifts.forEach((s, i) => {
    const max_available = s.online_seats_limit - s.online_booked_seats;
    if (max_available <= 0) return
    for (table in s.tables) {
      if (s.tables[table] > max_available) {
        delete s.tables[table];
      }
    }
    s.table_sizes = Object.values(s.tables);
    const b = $('<button/>', { id: 'bShift' + i, class: 'success bShift', css: { margin: 0, padding: '2%', width: '90%' } })
      .text(s.name)
      .appendTo(
        $('<li/>', { css: { margin: 0, padding: 0, 'text-align': 'center' } })
          .appendTo('#shiftGrid')
      );
    b.bcolor = b.css('background-color');
    b.bindex = s.id;
    b.attr('bindex', s.id);
    b.attr('bindex2', i);
    sButtons.push(b);
  });
  sButtons.forEach(b => {
    b.click(() => {
      sButtons.forEach(b => {
        b.css('background', b.bcolor);
        b.selected = false;
        b.attr('bselected', false);
      });
      b.css('background', 'darkgreen');
      b.attr('bselected', true);
    });
  });
  $('#loading').hide();
  $('#dateRow').show();
  return shifts;
}

function showReservation (pid) {
  $('.form').hide();
  mkCall(
    'POST',
    { action: 'getReservation', data: pid },
    res => {
      presentReservation(res.booking);
    },
    res => {
      showMessage(`Si prega di riprovare perché abbiamo riscontrato un errore.
        Se il problema persiste, consigliamo di 
        <a href="https://www.messenger.com/t/397632563730269/" target="_blank">entrare in chat</a>
        per consultare sulla prenotazione.<br>
        La ID della prenotazione è: ${pid}.`);
    }
  );
}



function presentReservation (r) {
  if ((!r) || 'error' in r) return bookingNotFound();
  const bc = r.booking_customer;
  const extra = JSON.parse(r.notes);

  const date = new Date(r.booked_for);
  const date2 = new Date(date.getTime() + r.duration * 60000);

  const div = $('#innerInfoDiv');
  const fs = $('<fieldset/>').appendTo(div);
  $('<legend/>').text('Informazione della Prenotazione').appendTo(fs);
  const addInfo = (s, id) => $('<div/>', { id: 'i_' + id }).html(`<b>${s}</b>: ${r[id]}`).appendTo(fs);
  const addInfo2 = (s, ss) => $('<div/>').html(`<b>${s}</b>: ${ss}`).appendTo(fs);
  addInfo2('Nome', bc.first_name + ' ' + bc.last_name);
  addInfo2('Telefono', extra.telephone || '--');
  addInfo2('Email', extra.email || '--');
  $('<br/>').appendTo(fs);
  addInfo2(
    'Quando',
    date.toLocaleString('it-IT', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
    }) + '-' + date2.toLocaleString('it-IT', { hour: '2-digit', minute:'2-digit' })
  );
  addInfo('Quantità di ospiti', 'people');
  addInfo2('Osservazioni', extra.note);
  addInfo2('Cani', extra.cani ? 'sì' : 'no');
  addInfo2('Seggiolini', extra.seggiolini ? 'sì' : 'no');
  $('<br/>').appendTo(fs);
  addInfo('Status', 'status');
  addInfo('ID della prenotazione', 'id');
  $('#modBtn').click(() => {
    // carica la pagina con la info? TTM
    console.log('mod');
  }).hide();
  const pid = r.id;
  $('#cancBtn').click(() => {
    console.log('can');
    mkCall(
      'POST',
      { action: 'cancelReservation', data: pid },
      res => {
        $('#i_status').html(`<b>Status</b>: cancelled`).css('background', 'pink');
      },
      res => {
        showMessage(`Si prega di riprovare perché abbiamo riscontrato un errore.
          Se il problema persiste, consigliamo di 
          <a href="https://www.messenger.com/t/397632563730269/" target="_blank">entrare in chat</a>
          per consultare sulla prenotazione.<br>
          La ID della prenotazione è: ${pid}.`);
      }
    );
  });
}

function validateEmail (email) {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

function validateData (data) {
  let message;
  if (data.name === '') {
    message = 'inserire un nome.';
  } else if (data.surname === '') {
    message = 'inserire un cognome.';
  } else if (data.telephone === '') {
    message = 'inserire un telefono.';
  } else if (!validateEmail(data.email)) {
    message = 'inserire un indirizzo e-mail.';
  } else if (data.date === '') {
    message = 'scegli una data.';
  } else if (data.shiftId === undefined) {
    message = 'selezionare un periodo per la prenotatione.';
  } else if (data.quantity == 0) {
    message = 'per quante persone è la prenotazione?';
  } else if (data.quantity > 10) {
    message = message10;
  } else {
    $('#notification').hide();
    return true;
  }
  showMessage(message);
}

function showMessage (message) {
  $('#notification').html(message).show();
}

const telString = '<p><a href="tel:+390718853384"><i class="fa fa-phone"></i><span itemprop="telephone"> 071 8853384</span></a></p>';

const messengerString = '<p><a target="_blank" href="https://m.me/cavecchiabeerstrot"><i class="fab fa-facebook-messenger"></i>Chat messenger</a></p>';

const message10 = `per <b>così tante persone</b>, vi preghiamo di contattarci:
${telString}
${messengerString}`;

function bookingNotFound () {
  const div = $('#innerInfoDiv');
  const fs = $('<fieldset/>').appendTo(div);
  $('<legend/>').text('Prenotazione non trovata').appendTo(fs);
  $('<div/>').html(`<p>Vi chiediamo gentilmente di mettervi in contatto con noi.</p>`).appendTo(fs);
  $('<div/>').html(telString).appendTo(fs);
  $('<div/>').html(messengerString).appendTo(fs);
  $('#buttonInfoDiv').hide();
}

function showNotesMessage (msg) {
  $('<p/>', { class: 'clearme', css: { background: 'orange', padding: '2%' } }).html(msg).appendTo('#notesDiv');
  $('#innerNotesDiv').hide();
}
