$(document).ready(() => {
  const url = new URL(window.location.href);
  const pid = url.searchParams.get('id');
  if (pid) {
    return showReservation(pid);
  }
  makeInterface();
})

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
  $.ajax({
    url: 'http://localhost:5001/check',
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
      console.log(res.reservation);
      presentReservation(res.reservation);
    }
  });
}

function presentReservation (r) {
  const div = $('#innerInfoDiv');
  const fs = $('<fieldset/>').appendTo(div);
  $('<legend/>').text('Informazione della Prenotazione').appendTo(fs);
  const addInfo = (s, id) => $('<div/>', { id: 'i_' + id }).html(`<b>${s}</b>: ${r[id]}`).appendTo(fs);
  addInfo('Nome', 'name');
  addInfo('Telefono', 'telephone');
  addInfo('Email', 'email');
  addInfo('Quando', 'date');
  addInfo('Quantità di ospiti', 'quantity');
  addInfo('Osservazioni', 'obs');
  addInfo('Status', 'status');
  addInfo('ID della prenotazione', 'reservationID');
  $('#modBtn').click(() => {
    console.log('mod');
  });
  const pid = r.reservationID;
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
  // $('<button/>', {
  //   text: 'Modificare',
  //   click: () => {
  //     console.log('mod');
  //   }
  // }).appendTo('#buttonInfoDiv');
  // $('<button/>', {
  //   text: 'Cancellare',
  //   click: () => {
  //     console.log('can');
  //   }
  // }).appendTo('#buttonInfoDiv');
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
        href: window.location.href
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
          const url = window.location.href + '?id=' + res.reservationID;
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
      mkShiftButtons(res.shifts);
    }
  });
}

function mkShiftButtons (shifts) {
  const sButtons = [];
  shifts.forEach((s, i) => {
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
}

function shiftAvailable (start, duration, seats, rooms) {
}
