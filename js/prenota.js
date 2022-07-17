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
      makeInterface_(pid_);
      return modifyReservation(pid_);
    }
    return showReservation(pid);
  }
  makeInterface_();
});

function makeInterface_ (pid) {
  mkCall(
    'POST',
    { action: 'days', data: '--' },
    res => {
      makeInterface(pid, res.dates);
    },
    res => {
      showMessage(messageError);
    }
  );
}

function modifyReservation (pid) {
  mkCall(
    'POST',
    { action: 'getReservation', data: pid },
    res => {
      const b = res.booking;
      const bc = b.booking_customer;
      const extra = JSON.parse(b.notes);
      const date = new Date(b.booked_for);
      const value = moment(date).format('DD/MMM/Y');
      $('#from').datetimepicker('setOptions', { value })
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
      const r = res;
      $('#innerNotesDiv').html('<b>Giorni chiusi:</b><br>' + r.dates.join('<br>'));
      $.datetimepicker.setLocale('it');
      jQuery('#from2').datetimepicker({
        lang: 'it',
        minDate: 0,
        timepicker: false,
        // formatDate:'Y-m-d',
        // disabledDates: r.dates,
        inline: true,
        onSelectDate: (dp, input) => {
          showDays(dp.toISOString());
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
  $('.clearme').remove();
  datetime = datetime || '2022-07-04T09:40:41.729Z';
  mkCall(
    'GET',
    { action: 'notes', data: datetime },
    res => {
      const r = JSON.parse(res);
      const date = (new Date(r.date)).toLocaleString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      $.datetimepicker.setLocale('it');
      jQuery('#from2').datetimepicker({
        lang: 'it',
        startDate: new Date(r.date),
        format:'d/M/Y',
        timepicker: false,
        inline:false,
        onSelectDate: (dp, input) => {
          showNotes(dp.toISOString());
        },
      }).datetimepicker('show');

      const b = r.bookings;
      const nbookings = b.length;
      if (!nbookings) return showNotesMessage(`nessuna prenotazione trovata il <b>${date}</b>.`);

      let nseggiolini = 0;
      let ncani = 0;
      const notes = [];
      b.forEach((i, ii) => {
        try {
          const n = JSON.parse(i.notes);
          if (!('seggiolini' in n))
            return
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
            $('<td/>').html(c ? 'SI' : '').appendTo(tr);
            $('<td/>').html(s == 0 ? '' : s).appendTo(tr);
            $('<td/>').html(n.note).appendTo(tr);
          }
        } catch (e) {
          console.log('ok');
        }
      });
      const summary = `Ci sono <b>${nbookings}</b> prenotazioni (${notes.length} online) per il giorno <b>${date}</b>, di cui <b>${ncani}</b> con cani e <b>${nseggiolini}</b> con seggiolini.`
      if (nseggiolini + ncani === 0) return showNotesMessage(summary);
      $('<p/>', { class: 'clearme', css: { padding: '2%' } }).html(summary).prependTo('#innerNotesDiv');
      if (notes.length > 0) {
        $('<button/>', { class: 'clearme', css: { margin: '2%', padding: '2%' } })
          .prependTo('#innerNotesDiv')
          .text('Invia promemoria')
          .on('click', () => {
            mkCall(
              'POST',
              { action: 'promemoria', data: datetime },
              res => {
                showMessage('Emails sent!');
              },
              res => {
                showMessage(messageError);
              }
            );
          });

      }
    },
    res => {
      showMessage(messageError);
    }
  );
}

function makeInterface (pid, dates) {
  $('#infoDiv').hide();
  $('#prenota').on('click', () => {
    // if (!$('#from').val()) return showMessage('selezionare una data');
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
            //se ti serve tienilo, ma nascondilo a tutti gli altri. non è user friendly e se un cliente ci chiama e ci da il pid noi non sappiamo cosa rispondere...
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
  $.datetimepicker.setLocale('it');
  jQuery('#from').datetimepicker({
    format:'d/M/Y',
    formatDate:'Y-m-d',
    disabledDates: dates || [],
    minDate: 0, // disabled for tests
    timepicker: false,
    onSelectDate: (dp, input) => {
      $('#loading').show();
      $('#from').chosen = true;
      input.chosenn = true;
      updateShifts(dp);
    },
  });
  $('#privacy2').on('click', () => {
    showMessage('I  dati vengono utilizzati solo per gestire la prenotazione e contattarti tramite email (assicurati non finisca nella spam) in caso di problemi o chiusura inaspettata del locale (es. causa maltempo).');
  });
}

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
function updateShifts (dp, selected, people) {
  $('.bShift').remove();
  const data = {
    day: dp.getDate(),
    month: dp.getMonth(),
    year: dp.getYear() + 1900
  };
  mkCall(
    'POST',
    { action: 'getShifts', data },
    res => {
      const pad0 = i => String(i).padStart(2, '0');
      const d = `${data.year}-${pad0(data.month + 1)}-${pad0(data.day)}`;
      const wd = weekdays[dp.getDay()];
      const shifts_ = res.shifts.filter(s => (s.end_period >= d) && (s.start_period <= d) && (s.weekdays_period.includes(wd)));
      const shifts = mkShiftButtons(shifts_, selected);
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
      if (res.booking === null) {
        $('#yes').hide();
        $('#no').hide();
        return showConsultaMessage('Non abbiamo trovato questa prenotazione.', `Puoi scriverci su ${messengerString} o chiamarci allo ${telString}.`);
      }
      presentReservation(res.booking);
    },
   //se ti serve tienilo, ma nascondilo a tutti gli altri. non è user friendly e se un cliente ci chiama e ci da il pid noi non sappiamo cosa rispondere...
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
  $('#modify').click(() => {
    showConsultaMessage(
      'Vuoi modificare la prenotazione?',
      '(NOTA: La prenotazione rimane la stessa fino a quando non viene premuto il tasta "Prenota il tavolo".)',
      () => {
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
            $('<li/>').appendTo('#infoList').html(`<b>Status</b>: Cancellata`).css('background', 'pink');
            $('#no').click();
            $('#modify').hide();
            $('#cancel').hide();
          },

          //pid e ti serve tienilo, ma nascondilo a tutti gli altri. non è user friendly e se un cliente ci chiama e ci da il pid noi non sappiamo cosa rispondere...
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
  $('.error').attr('style', 'border: solid 1px #ccc');
  $('.error1').hide()
  $('#notification').hide();
  const messages = [];
  const ids = [];
  if (!$('#from').val()) {
    messages.push('Scegli il giorno.');
    ids.push('#from');
  }
  if (data.date === '') {
    messages.push('Scegli il giorno.');
    ids.push('#from1');
  }
  if (data.quantity == 0) {
    messages.push('Inserisci il numero di persone.');
    ids.push('#quantity1');
  }
  if (data.shiftId === undefined) {
    messages.push('Seleziona il turno.');
    ids.push('#shiftGrid1');
  }
  if (data.name === '') {
    messages.push('Inserisci un nome.');
    ids.push('#name1');
  }
  if (data.surname === '') {
    messages.push('Inserisci un cognome.');
    ids.push('#surname1');
  }
  if (!validateEmail(data.email)) {
    messages.push('Inserisciun un indirizzo e-mail.');
    ids.push('#email1');
  }
  if (data.telephone === '') {
    messages.push('Inserisci un numero di telefono.');
    ids.push('#telephone1');
  }
  if (!$('#privacy').prop('checked')) {
    messages.push('è necessario accettare la privacy.');
    ids.push('#privacy2');
  }
  if (ids.length > 0) {
    ids.forEach(i => showError(i));
    showMessage(messages.join('<br>'));
    return false;
  }
  return true;
}

function showMessage (message) {
  $('#modalLead').html(message);
  $('#myModal').foundation('reveal', 'open');
}

const telString = '<a href="tel:+390718853384"><span itemprop="telephone"> 071 8853384</span></a>';

const messengerString = '<a target="_blank" href="https://m.me/cavecchiabeerstrot"> Facebook messenger</a>';

const message10 = `per <b>così tante persone</b>, vi preghiamo di contattarci:
${telString}
${messengerString}`;

/*const messageError = `Si prega di riprovare perché abbiamo riscontrato un errore.<br>
Se il problema persiste, ti consigliamo di 
entrare nel ${messengerString} o di chiamare ${telString}.<br>`;*/

const messageError = `<h2>il Server non è raggiungibile</h2>
                      <p>Riprova fra qualche istante e assicurati di avere campo nel cellulare o internet funzionante da computer. Grazie.</p>
                      <li class="no-bullet">Se il problema persiste:
                        <ul class="disc">
                          <li>Scrivici su ${messengerString}</li>
                          <li>Chiamaci al numero ${telString}</li>
                        </ul>
                      </li>`;

function bookingNotFound () {
  const div = $('#innerInfoDiv');
  const fs = $('<fieldset/>').appendTo(div);
  $('<legend/>').text('Prenotazione non trovata').appendTo(fs);
  $('<div/>').html(`<p>Vi chiediamo gentilmente di contattarci.</p>`).appendTo(fs);
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
    $('#modalLead').html(message);
    $('#modalText').html(message2);
    $('#myModal').foundation('reveal', 'open');
}

function mkQuantityOptions (shifts, people) {
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

function showError (id) {
  // $(id).attr("style", "display: block !important")
  $(id.replace('1', '')).attr('style', 'border: 2px solid red');
}
