$(document).ready(() => {
  const url = new URL(window.location.href);
  const pid = url.searchParams.get('id');
  if (pid) {
    if (pid === 'notes') {
      return showNotes();
    } else if (pid === 'days') {
      return showDays();
    } else if (pid === 'test') {
      return testeLambda();
    } else if (pid.endsWith('_modifica')) {
      const pid_ = pid.split('_modifica')[0];
      makeInterface(pid_);
      return modifyReservation(pid_);
    }
    return showReservation(pid);
  }
  makeInterface();
});

function modifyReservation (pid) {
  mkCall(
    'POST',
    { action: 'getReservation', data: pid },
    res => {
      const b = res.booking;
      const bc = b.booking_customer;
      const extra = JSON.parse(b.notes);
      window.mres = { b, bc, extra };
      // load mres in the form:
      const date = new Date(b.booked_for);
      const value = moment(date).format('DD/MMM/Y');
      $('#from').datetimepicker('setOptions', { value })
      window.bbb = b;
      $('#quantity').prop('disabled', false).val(b.people);
      updateShifts(date, b.shift_id, b.people);
      $('#obs').val(extra.note === '--' ? '' : extra.note);
      $('#seggiolini').val(extra.seggiolini);
      $('#cani').prop('checked', extra.cani);
      $('#name').val(bc.first_name);
      $('#surname').val(bc.last_name);
      $('#email').val(extra.email);
      $('#telephone').val(extra.telephone);
      // $($('.aShift').filter((i, ii) => $(ii).attr('bindex') == b.shift_id)[0]).click();
    },
    res => {
      showMessage(`${messageError}
        La ID della prenotazione è: ${pid}.`);
    }
  );
}

// beerstrot-prod:
// const url = 'https://6nw3zi6sbkph6dledhd4op3mvq0aaduw.lambda-url.eu-central-1.on.aws/';
const url = 'http://localhost:5001/entry';
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

function showDays (datetime) {
  $('.form').hide();
  $('#notesTable').hide();
  $('#notesDiv').show().css('margin-bottom', '50%');
  $('#innerNotesDiv').css('margin-top', '30%');
  $('#ttitle').text('Giorni di Chiusura');
  mkCall(
    'POST',
    { action: 'days', data: datetime || '--' },
    res => {
      const r = window.rara = res;
      const date = (new Date(r.date)).toLocaleString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      $('#innerNotesDiv').html('<b>Giorni chiusi:</b><br>' + r.dates.join('<br>'));

      jQuery('#from2').datetimepicker({
        // startDate: new Date(r.date),
        minDate: 0, // disabled for tests
        // formatDate:'Y-m-d',
        timepicker: false,
        // disabledDates: r.dates,
        inline: true,
        onSelectDate: (dp, input) => {
          showDays(dp.toISOString());
          // toggle enable/disable the date
        },
      }).datetimepicker('show');
    },
    res => {
      showMessage(messageError);
    }
  );
}

function showNotes (datetime) {
  $('.form').hide();
  $('#notesDiv').show();
  $('#innerNotesDiv').show();
  mkCall(
    'GET',
    { action: 'notes', data: datetime || '2022-07-04T09:40:41.729Z' },
    res => {
      window.rara = res;
      const r = JSON.parse(res);
      const date = (new Date(r.date)).toLocaleString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      jQuery('#from2').datetimepicker({
        startDate: new Date(r.date),
        format:'d/M/Y',
        timepicker: false,
        inline:true,
        onSelectDate: (dp, input) => {
          showNotes(dp.toISOString());
        },
      }).datetimepicker('show');

      const b = r.bookings;
      const nbookings = b.length;
      if (!nbookings) return showNotesMessage(`nessuna prenotazione per <b>${date}</b>.`);

      let nseggiolini = 0;
      let ncani = 0;
      const notes = [];
      window.bbb = b;
      b.forEach((i, ii) => {
        try {
          const n = JSON.parse(i.notes);
          notes.push(n);
          const s = n.seggiolini;
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
            $('<td/>', { css: { background: s == 0 ? '' : 'rgba(200, 200, 255, 0.5)' } }).html(s == 0 ? '' : s).appendTo(tr);
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
      showMessage(messageError);
    }
  );
}

function makeInterface (pid) {
  $('#infoDiv').hide();
  $('#prenota').on('click', () => {
    console.log('yeah man');
    if (!$('#from').val()) return showMessage('selezionare una data');
    const d = $('#from').datetimepicker('getValue');
    d.setHours(12);
    const data = {
      date: d.toISOString(),
      shiftId: $($('.aShift').filter((i, ii) => $(ii).attr('bselected') == 'true')[0]).attr('bindex'),
      href: window.location.href,
      cani: $('#cani').is(':checked'),
      seggiolini: $('#seggiolini').val()
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
        if (res.reservationID2 === 'noPlacesLeft') {
          return showMessage(`Non abbiamo più posti questo giorno.`);
        }
        let  u = window.location.href;
        u = u[u.length - 1] == '/' ? u : (u.split('/').reverse().slice(1).reverse().join('/') + '/');
        const url = u + 'consulta.html?id=' + res.reservationID2;
        if (pid) { // user is modifying, cancel previous reservation:
          mkCall(
            'POST',
            { action: 'cancelReservation', data: pid },
            res => {
              window.location.href = url;
            },
            res => {
              showMessage(`${messageError}
                La ID della prenotazione è: ${pid}.`);
            }
          );
        } else {
          window.location.href = url;
        }
      },
      res => {
        showMessage(messageError);
      }
    );
  });

  // https://flatpickr.js.org/ (good alternative)
  // https://xdsoft.net/jqplugins/datetimepicker/ (chosen)
  // $.datetimepicker.setLocale('it')
  const disableDates = []; // get from database, given by ADM, TTM
  jQuery('#from').datetimepicker({
    disableDates,
    // lang: 'it',
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

function updateShifts (dp, selected, people) {
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
      window.rrrr = res;
      const shifts = mkShiftButtons(res.shifts, selected);
      mkQuantityOptions(shifts, people);
    },
    res => showMessage(messageError)
  );
}

function mkShiftButtons (shifts, selected) {
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
    // const b = $('<button/>', { id: 'bShift' + i, class: 'success bShift', css: { margin: 0, padding: '2%', width: '90%' } })
    const b = $('<button/>', { id: 'aShift' + i, class: 'small button aShift' })
      .text(s.name)
      .appendTo(
        // $('<li/>', { css: { margin: 0, padding: 0, 'text-align': 'center' } })
        $('<li/>', { class: 'bShift' })
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
      b.css('background', 'darkred');
      b.attr('bselected', true);
    });
  });
  if (selected) {
    $($('.aShift').filter((i, ii) => $(ii).attr('bindex') == selected)[0]).click();
  }
  return shifts;
}

function showReservation (pid) {
  $('.form').hide();
  $('#prenotaDiv').show();
  mkCall(
    'POST',
    { action: 'getReservation', data: pid },
    res => {
      presentReservation(res.booking);
    },
    res => {
      showMessage(`${messageError}
        La ID della prenotazione è: ${pid}.`);
    }
  );
}



function presentReservation (r) {
  if ((!r) || 'error' in r) return bookingNotFound();
  // $('#ttitle').text('La tua Prenotazione :-)');
  const bc = r.booking_customer;
  const extra = JSON.parse(r.notes);

  const date = new Date(r.booked_for);
  const date2 = new Date(date.getTime() + r.duration * 60000);

  const h = (id, info) => $('#' + id).text(info);
  h('name', bc.first_name + ' ' + bc.last_name);
  h('telephone', extra.telephone);
  h('email', extra.email);
  h('day', date.toLocaleString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  h('time1', date.toLocaleString('it-IT', { hour: '2-digit', minute:'2-digit' }));
  h('time2', date2.toLocaleString('it-IT', { hour: '2-digit', minute:'2-digit' }));
  h('people', r.people);
  h('note', extra.note);
  const s = extra.seggiolini
  h('segg', s == 0 ? 'No' : s);
  h('dog', extra.cani ? 'Sì' : 'No');
  window.bbb = bc;
  window.eee = extra;
  window.rrr = r;
  $('#modify').click(() => {
    showConsultaMessage(
      'Modifica la prenotazione?',
      'La sua prenotazione rimane la stessa fino a quando confermi i nuovi dati.',
      () => {
        console.log('come on');
        const pid = new URL(window.location.href).searchParams.get('id') + '_modifica';
        window.location.href = window.location.href.split('/').reverse().slice(1).reverse().join('/') + '/index.html?id=' + pid;
        // carica la pagina con tutti i datti iniziale
      },
      () => $('#close-modal').click()
    );
  });
  const pid = r.id;
  $('#cancel').click(() => {
    showConsultaMessage(
      'Cancella la prenotazione?',
      '',
      () => {
        mkCall(
          'POST',
          { action: 'cancelReservation', data: pid },
          res => {
            $('<li/>').appendTo('#infoList').html(`<b>Status</b>: cancelled`).css('background', 'pink');
            $('#no').click();
            $('#modify').hide();
            $('#cancel').hide();
          },
          res => {
            showMessage(`${messageError}
              La ID della prenotazione è: ${pid}.`);
          }
        );
      },
      () => $('#close-modal').click()
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
  $('#modalLead').html(message);
  $('#myModal').foundation('reveal', 'open');
}

const telString = '<p><a href="tel:+390718853384"><i class="fa fa-phone"></i><span itemprop="telephone"> 071 8853384</span></a></p>';

const messengerString = '<p><a target="_blank" href="https://m.me/cavecchiabeerstrot"><i class="fab fa-facebook-messenger"></i>Chat messenger</a></p>';

const message10 = `per <b>così tante persone</b>, vi preghiamo di contattarci:
${telString}
${messengerString}`;

const messageError = `Si prega di riprovare perché abbiamo riscontrato un errore.<br>
Se il problema persiste, ti consigliamo di 
entrare nel ${messengerString} o di chiamare ${telString}.<br>`;

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

function showConsultaMessage (message, message2, callYes, callNo) {
    $('#yes').on('click', callYes);
    $('#no').on('click', callNo);
    $('#modalLead').text(message);
    $('#modalText').text(message2);
    $('#myModal').foundation('reveal', 'open');
}

function mkQuantityOptions (shifts, people) {
  window.sss = shifts;
  // find biggest table
  const biggestTable = shifts.reduce((m, s) => Math.max(m, ...s.table_sizes), 0);
  // make options reaching it
  $('.aquantity').remove();
  [...Array(biggestTable).keys()]
    .forEach(i => {
      $('<option/>', { value: i + 1, class: 'aquantity' })
        .text(i + 1).appendTo('#quantity');
    });
  $('#quantity').prop('disabled', false)
  // enable select
  $('#quantity').on("input", function() {
    console.log('yey', $(this).val());
    const v = Number($(this).val());
    shifts.forEach((s, i) => $('#aShift' + i).prop('disabled', s.table_sizes.filter(s => s >= v).length === 0));
    const totalDisabled = shifts.reduce((c, i, ii) => c + $('#aShift' + ii).prop('disabled'), 0); 
    if (totalDisabled === shifts.length) return showMessage(message10);
    $('#notification').hide();
  });
  if (people) {
    $('#quantity').val(people);
  }
}
