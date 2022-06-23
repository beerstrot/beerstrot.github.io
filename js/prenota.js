$(document).ready(() => {
  const url = new URL(window.location.href);
  const pid = url.searchParams.get('id');
  if (pid) {
    if (pid == 'notes') {
      return showNotes();
    }
    return showReservation(pid);
  }
  makeInterface();
});

function showNotes (datetime) {
  $('.form').hide();
  $('#infoDiv').hide();
  $('.clearme').remove();
  const nd = $('#notesDiv').show();
  $('#innerNotesDiv').show();
  $.ajax({
    url: 'http://localhost:5001/bookings',
    type: 'GET',
    data: { date: datetime || '2022-06-13T09:40:41.729Z' }, // (new Date()).toISOString() },
    crossDomain: true,
    error: res => {
      $('#loading').hide();
      showMessage(`Si prega di riprovare perché abbiamo riscontrato un errore.
        Se il problema persiste, consigliamo di 
        <a href="https://www.messenger.com/t/397632563730269/" target="_blank">entrare in chat</a>.`);
    },
    beforeSend: function() {
      $('#loading').show();
    },
    success: res => {
      const r = JSON.parse(res);
      console.log('the bookings:', r.bookings);
      console.log('the date:', r.date);
      const date = (new Date(r.date)).toLocaleString('it-IT', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});

      jQuery('#from2').datetimepicker({
        startDate: new Date(r.date),
        format:'d/M/Y',
        minTime: '12:00',
        maxTime: '12:00',
        defaultTime: '12:00',
        allowTimes:['12:00'],
        // minDate: 0, // disabled for tests
        timepicker: false,
        // onChangeDateTime: (dp, input) => {
        onSelectDate: (dp, input) => {
          $('#loading').show();
          updateShifts(dp);
          window.ddp = dp;
          showNotes(dp.toISOString());
        },
        inline:true,
      }).datetimepicker('show');

      const b = r.bookings;
      $('#loading').hide();
      window.bbb = r;
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
      window.ccc = { nbookings, notes, nseggiolini, ncani };
      // const summary = `Ci sono ${nbookings} per il giorno,  `;
      const summary = `Ci sono <b>${nbookings}</b> le prenotazioni per il giorno <b>${date}</b>, di cui <b>${ncani}</b> con cani e <b>${nseggiolini}</b> con seggiolini.`
      if (nseggiolini + ncani === 0) return showNotesMessage(summary);
      $('<p/>', { class: 'clearme', css: { padding: '2%' } }).html(summary).prependTo('#innerNotesDiv');
    }
  });
}


let tryCount = 0
function getShifts() {
  $.ajax({
    url: 'http://localhost:5001/shifts',
    type: 'GET',
    crossDomain: true,
    error: res => {
      $('#loading').hide();
      showMessage(`Si prega di riprovare perché abbiamo riscontrato un errore.
        Se il problema persiste, consigliamo di 
        <a href="https://www.messenger.com/t/397632563730269/" target="_blank">entrare in chat</a>.`);
    },
    beforeSend: function() {
      $('#loading').show();
    },
    success: res => {
      console.log('the shifts:', res);
      $('#loading').hide();
    }
  });
}

function showReservation (pid) {
  $('.form').hide();
  console.log(pid);
  $.ajax({
    url: 'http://localhost:5001/check',
    type: 'GET',
    crossDomain: true,
    data: { pid },
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    error: res => {
      console.log(res, 'ERROR');
      $('#loading').hide();
      showMessage(`Si prega di riprovare perché abbiamo riscontrato un errore.
        Se il problema persiste, consigliamo di 
        <a href="https://www.messenger.com/t/397632563730269/" target="_blank">entrare in chat</a>
        per consultare sulla prenotazione.<br>
        La ID della prenotazione è: ${pid}.`);
    },
    beforeSend: function() {
      $('#loading').show();
    },
    success: res => {
      $('#loading').hide();
      console.log(res, 'SUCCESS');
      window.bbb = res.booking;
      presentReservation(res.booking);
    }
  });
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
    // carica la pagina con la info?
    console.log('mod');
  }).hide();
  const pid = r.id;
  $('#cancBtn').click(() => {
    console.log('can');
    $.ajax({
      url: 'http://localhost:5001/cancel',
      type: 'GET',
      crossDomain: true,
      data: { pid },
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      error: res => {
        $('#loading').hide();
        showMessage(`Si prega di riprovare perché abbiamo riscontrato un errore.
          Se il problema persiste, consigliamo di 
          <a href="https://www.messenger.com/t/397632563730269/" target="_blank">entrare in chat</a>
          per consultare sulla prenotazione.<br>
          La ID della prenotazione è: ${pid}.`);
      },
      beforeSend: function() {
        $('#loading').show();
      },
      success: res => {
        $('#loading').hide();
        $('#i_status').html(`<b>Status</b>: cancelled`).css('background', 'pink');
      }
    });
    // chiamata per cancellare la prenotazione
    // atualiza la pagina notificando il cancelamento
  });
}

function validateEmail (email) {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

function validateData (data) {
  let message;
  if (!validateEmail(data.email)) {
    // message near the button
    message = 'inserire un indirizzo e-mail.';
  } else if (data.date === '') {
    message = 'scegliere una data e un orario.';
  } else if (data.shiftId === undefined) {
    message = 'selezionare un periodo per la prenotatione.';
  } else if (data.name === '') {
    message = 'inserire un nome.';
  } else if (data.surname === '') {
    message = 'inserire un cognome.';
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

function makeInterface () {
  $('#infoDiv').hide();
  $('<button/>', {
    css: {
      'margin-left': '3%'
    },
    text: 'Prenotare',
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

      console.log('data sent:', data);
      $.ajax({
        url: 'http://localhost:5001/prenota',
        type: 'POST',
        crossDomain: true,
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        error: res => {
          $('#loading').hide();
          showMessage(`Si prega di riprovare perché abbiamo riscontrato un errore.
            Se il problema persiste, consigliamo di 
            <a href="https://www.messenger.com/t/397632563730269/" target="_blank">entrare in chat</a>
            per effettuare la prenotazione.`);
        },
        beforeSend: function() {
          $('#loading').show();
        },
        success: res => {
          const url = window.location.href + '?id=' + res.reservationID2;
          window.location.href = url;
          // window.location.assign(url);
          // window.location.reload();
          // window.location.assign('https://www.beerstrot.it/social/');
        }
      });
    }
  }).appendTo('#contentDiv3');
  // https://flatpickr.js.org/ (good alternative)
  // https://xdsoft.net/jqplugins/datetimepicker/ (chosen)

  const disableDates = []; // get from database, given by ADM
  jQuery('#from').datetimepicker({
    disableDates,
    format:'d/M/Y',
    minTime: '12:00',
    maxTime: '12:00',
    defaultTime: '12:00',
    allowTimes:['12:00'],
    // minDate: 0, // disabled for tests
    timepicker: false,
    // onChangeDateTime: (dp, input) => {
    onSelectDate: (dp, input) => {
      $('#loading').show();
      window.ddd = { dp, input };
      console.log('dp select');
      $('#from').chosen = true;
      input.chosenn = true;
      updateShifts(dp);
    },
  });
}

function updateInterface (availability) {
  console.log(availability, 'avail');
}

function getAvailability (date) {
  date = date || new Date();
  date.setHours(0);
  date.setDate(date.getDate() - 40);
  $.ajax({
    url: 'http://localhost:5001/freeTables',
    type: 'GET',
    crossDomain: true,
    data: { date: date.toISOString() },
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    error: res => console.log(res, 'the res'),
    success: res => {
      window.rrr = res;
      const { rooms, bookings } = rrr;
      const tableIds = rooms.map(r => r.tables.map(i => i.id)).flat();
      const bookedHours = bookings.map(i => i.booked_for);
      bookedHours.sort();
      window.aa = { rooms, bookings, tableIds, bookedHours };
      updateInterface(res);
    }
  });
}

const weekdays = {
  Su: 0,
  Mo: 1,
  Tu: 2,
  We: 3,
  Th: 4,
  Fr: 5,
  Sa: 6,
};
function updateShifts (dp) {
  $('.bShift').remove();
  const data = {
    day: dp.getDate(),
    month: dp.getMonth(),
    year: dp.getYear() + 1900
  };
  let shifts = [];
  $.ajax({
    url: 'http://localhost:5001/shiftsAvailable',
    type: 'GET',
    crossDomain: true,
    data,
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    error: res => console.log(res, 'the res'),
    success: res => {
      window.shifts_available = res;
      shifts = mkShiftButtons(res.shifts);
    }
  });
  $('#quantity').on("input", function() {
    const v = Number($(this).val());
    console.log(v, shifts);
    shifts.forEach((s, i) => {
      $('#bShift' + i).prop('disabled', s.table_sizes.filter(s => s >= v).length === 0);
    });
    if (v > 10) {
      return showMessage(message10);
    }
    $('#notification').hide();
  });
}

function mkShiftButtons (shifts) {
  const sButtons = [];
  shifts.forEach((s, i) => {
    const max_available = s.online_seats_limit - s.online_booked_seats;
    if (max_available <= 0) return
    for (table in s.tables) {
      console.log(table);
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
  // $('#bShift0').click();
  $('#loading').hide();
  $('#dateRow').show();
  return shifts;
}

const telString = '<p><a href="tel:+390718853384"><i class="fa fa-phone"></i><span itemprop="telephone"> 071 8853384</span></a></p>';

const messengerString = '<p><a target="_blank" href="https://m.me/cavecchiabeerstrot"><i class="fab fa-facebook-messenger"></i>Chat messenger</a></p>';

const message10 = `per prenotazioni di <b>oltre 10 persone</b>, vi preghiamo di contattarci:
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
