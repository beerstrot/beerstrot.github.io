$(document).ready(() => {
  const url = new URL(window.location.href);
  const pid = url.searchParams.get('id');
  if (pid) {
    return showReservation(pid);
  }
  getShifts();
})

let tryCount = 0
function getShifts() {
  $.ajax({
    url: 'http://localhost:5001/shifts',
    type: 'GET',
    crossDomain: true,
    error: res => {
      // if (tryCount++ < 3) return getShifts();
      $('#loading').hide();
      showMessage(`Si prega di riprovare perché abbiamo riscontrato un errore.
        Se il problema persiste, consigliamo di 
        <a href="https://www.messenger.com/t/397632563730269/" target="_blank">entrare in chat</a>.`);
    },
    beforeSend: function() {
      $('#loading').show();
    },
    success: res => {
      console.log(res);
      window.rrr = res;

      makeInterface(JSON.parse(res));
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
  } else if (data.name === '') {
    message = 'inserire un nome.';
  } else if (data.surname=== '') {
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

function makeInterface (shifts) {
  $('#infoDiv').hide();
  $('<button/>', {
    css: {
      'margin-left': '3%'
    },
    text: 'Prenotare',
    tabindex: 7,
    click: () => {
      const data = {
        date: $('#from').datetimepicker('getValue').toISOString(),
        href: window.location.href
      };
      [
        'name',
        'cognome',
        'telephone',
        'email',
        'quantity',
        'obs',
      ].forEach(id => { data[id] = $(`#${id}`).val() });
      const sBut = sButtons.filter(b => b.selected);
      if (sBut.length === 0) return showMessage('selezionare un periodo per la prenotation');
      data.shift = shifts[sBut[0].index];

      if (!validateData(data)) return

      // check if dateTime is in tolerance
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
    step: 15,
    format:'d/M/Y, H.i',
    // minDate: 0,
    defaultTime: '20',
    minTime: '19',
    maxTime: '23',
    onChangeDateTime: (dp, input) => {
      $('#from').chosen = true;
      input.chosenn = true;
      window.ddd = { dp, input };
    },
  });
  const sButtons = [];
  shifts.forEach((s, index) => {
    const hour = Math.floor(s.start_time / (60 * 60));
    const mins = Math.floor((s.start_time % (60 * 60)) / 60);
    const hour_ = Math.floor(s.end_time / (60 * 60));
    const mins_ = Math.floor((s.end_time % (60 * 60)) / 60);
    const b = $('<button/>', { class: 'success bShift', css: { margin: 0, padding: '2%', width: '90%' } })
      .text(`${hour}.${mins} - ${hour_}.${mins_}`)
      .appendTo(
        $('<li/>', { css: { margin: 0, padding: 0, 'text-align': 'center' } })
          .appendTo('#shiftGrid')
      );
    b.bcolor = b.css('background-color');
    b.index = index;
    sButtons.push(b);
  });
  sButtons.forEach(b => {
    b.click(() => {
      sButtons.forEach(b => {
        b.css('background', b.bcolor);
        b.selected = false;
      });
      b.css('background', 'darkgreen');
      b.selected = true;
    });
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
