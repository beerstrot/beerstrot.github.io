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

const loadExtra = booking => {
  const e = JSON.parse(booking.extra);
  return e;
}

function modifyReservation (pid) {
  mkCall(
    'POST',
    { action: 'getReservation', data: pid },
    res => {
      $('#ttitle').text('Modica la Prenotazione');
      $('<p/>').text('La prenotazione viene modificata solo quando clicchi il pulsante "Modifica Prenotazione"')
        .insertAfter('#ttitle');
      $('#prenota').text('Modifica Prenotazione');
      const b = res.booking;
      const bc = b.booking_customer;
      const extra = loadExtra(b);
      const date = new Date(b.booked_for);
      // const value = moment(date).format('Y-MM-DD');
      const value = moment(date).format('DD/MM/Y');
      jQuery('#from').flatpickr().setDate(date);
      $('#quantity').prop('disabled', false).val(b.people);
      updateShifts(date, b.shift_id, b.people);
      $('#obs').val(extra.note === '--' ? '' : extra.note);
      $('#seggiolini').val(extra.seggiolini);
      $('#cani').prop('checked', extra.cani);
      $('#name').val(bc.first_name);
      $('#surname').val(bc.last_name);
      $('#email').val(extra.email);
      $('#telephone').val(extra.telephone);
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
let pCount = 0;
function mkCall(type, data, success, error, beforeSend, complete) {
  if (!['POST', 'GET'].includes(type)) return console.log(`this ajax method is not good: ${type}`);
  const set = {
    crossDomain: true,
    url,
    type,
    data,
    success,
    error,
    beforeSend: () => {
      pCount++;
      $('#loading').show();
    },
    complete: () => {
      if (--pCount === 0)
        $('#loading').hide();
    }
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
  $('#ttitle').text('BB Giorni di Chiusura AA');
  $('#yes').text('Sì, aggiungere/rimuovere questo giorno di chiusura.');
  $('#no').text('No, non aggiungere/rimuovere questo giorno di chiusura.');
  mkCall(
    'POST',
    { action: 'days', data: datetime || '--' },
    res => {
      const r = res;
      $('#innerNotesDiv').html('<b>Giorni chiusi ACC:</b><br>' + r.dates.join('<br>'));
      jQuery('#from2').flatpickr({
        minDate: 'today',
        locale: 'it',
        dateFormat:'d/M/Y',
        disableMobile: true,
        onChange: (dp, input) => {
          dp[0].setHours(12);
          toggleDate(dp[0]);
        },
      });
    },
    res => {
      showMessage(messageError);
    }
  );
}

function toggleDate (dp) {
  const date_ = (new Date(dp)).toLocaleString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  showConsultaMessage(
    `Sei sicuro di aggiungere/rimovere questo giorno di chiusura?? (giorno: ${date_})`,
    `Se aggiungi il giorno di chiusura, tutte le prenotazione per questo giorno saranno cancellate <br>I clienti prenotati riceveranno l'email di chiusura e
    cancellazione della prenotazione.<br>
    Se vuoi, fai un controllo dei clienti prenotati qui <a href="https://www.beerstrot.it/dashboard/" targer="_blank">dashboard</a>.`,
    () => {
      const date = dp.toISOString();
      showDays(date);
      $('#close-modal').click();
    },
    () => $('#close-modal').click(),
    true,
  );
}

function showNotes (datetime) {
  $('#loading').show();
  $('.form').hide();
  $('#notesDiv').show();
  $('#innerNotesDiv').show();
  $('.clearme').remove();
  datetime = datetime || new Date().toISOString();
  mkCall(
    'GET',
    { action: 'notes', data: datetime },
    res => {
      const r = JSON.parse(res);
      const date = (new Date(r.date)).toLocaleString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const tables = {};
      r.rooms.forEach(r => {
        r.tables.forEach(t => {
          tables[t.id] = t.name;
        });
      });
      const shifts = r.shifts.reduce((a, i) => {
        a[i.id] = i;
        a[i.id].bookings = [];
        a[i.id].obookings = [];
        return a;
      }, {});
      shifts.anon = { name: 'anon', bookings: [] };
      jQuery('#from2').flatpickr({
        locale: 'it',
        dateFormat:'d/M/Y',
        disableMobile: true,
        onChange: (dp, input) => {
          dp[0].setHours(12);
          showNotes(dp[0].toISOString());
        },
      });

      const b = r.bookings;
      const nbookings = b.length;
      if (!nbookings) return showNotesMessage(`nessuna prenotazione trovata il <b>${date}</b>.`);

      let nseggiolini = 0;
      let ncani = 0;
      const notes = [];
      const data = [];
      b.forEach((i, ii) => {
        try {
          const n = loadExtra(i);
          if (!('seggiolini' in n))
            return
          notes.push(n);
          i.notes_ = n;
          shifts[i.shift_id].obookings.push(i)
          const s = Number(n.seggiolini);
          const c = Boolean(n.cani);
          nseggiolini += s;
          ncani += c;
          const bc = i.booking_customer;
          data.push({
            name: bc.first_name + ' ' + bc.last_name,
            people: i.people,
            table: i.tables.reduce((a, i) => {
              a.push(tables[i.table_id]);
              return a;
            }, []).join(', '),
            telephone: n.telephone || '',
            email: n.email || '',
            time: new Date(i.booked_for).toLocaleString('it-it', { hour: '2-digit', minute:'2-digit' }),
            cani: c ? 'SI' : '',
            seg: s == 0 ? '' : s,
            note: n.note
          });
        } catch (e) {
          if (i.shift_id === null)
            return shifts.anon.bookings.push(i);
          shifts[i.shift_id].bookings.push(i);
        }
      });
      data.sort((a, b) => a.time < b.time ? -1 : 1).forEach(n => {
        const tr = $('<tr/>', { class: 'clearme' }).appendTo('#notesTableBody');
        $('<td/>').html(n.name).appendTo(tr);
        $('<td/>', { css: { 'text-align': 'right' } }).html(n.people).appendTo(tr);
        $('<td/>').html(n.table).appendTo(tr);
        $('<td/>').html(n.telephone).appendTo(tr);
        $('<td/>').html(n.email).appendTo(tr);
        $('<td/>', { css: { 'text-align': 'left' } }).html(n.time).appendTo(tr);
        $('<td/>').html(n.cani).appendTo(tr);
        $('<td/>', { css: { 'text-align': 'right' } }).html(n.seg).appendTo(tr);
        $('<td/>').html(n.note).appendTo(tr);
      });
      const sentences = [];
      let total_ = 0;
      for (k in shifts) {
        const s = shifts[k];
        if (k === 'anon') continue;
        s.people_online = s.obookings.reduce((a, ss) => a + ss.people, 0);
        s.people_hand = s.bookings.reduce((a, ss) => a + ss.people, 0);
        const total = s.people_online + s.people_hand;
        total_ += total;
        if (total === 0) continue
        const tr = $('<tr/>', { class: 'clearme' }).appendTo('#shiftsTableBody');
        $('<td/>', { css: { 'text-align': 'left' } }).html(s.name).appendTo(tr);
        $('<td/>', { css: { 'text-align': 'right' } }).html(total).appendTo(tr);
        $('<td/>', { css: { 'text-align': 'right' } }).html(s.people_online).appendTo(tr);
        $('<td/>', { css: { 'text-align': 'right' } }).html(s.people_hand).appendTo(tr);
      }
      shifts.anon.bookings.forEach(b => {
        const { t, t2 } = getBookingTimes(b, true);
        const tr = $('<tr/>', { class: 'clearme' }).appendTo('#anonTableBody');
        $('<td/>', { css: { 'text-align': 'left' } }).html(t).appendTo(tr);
        $('<td/>', { css: { 'text-align': 'left' } }).html(t2).appendTo(tr);
        $('<td/>', { css: { 'text-align': 'right' } }).html(b.people).appendTo(tr);
        $('<td/>', { css: { 'text-align': 'left' } }).html(
          b.tables.reduce((a, i) => {
            a.push(tables[i.table_id]);
            return a;
          }, []).join(', ')
        ).appendTo(tr)
        total_ += b.people;
      });
      const summary = `Ci sono <b>${nbookings}</b> prenotazioni (<b>${notes.length}</b> online) per il giorno <b>${date}</b>, di cui <b>${ncani}</b> con cani e <b>${nseggiolini}</b> con seggioloni. Totale di <b>${total_}</b> persone.`;
      $('<p/>', { class: 'clearme', css: { padding: '' } }).html(summary).prependTo('#innerNotesDiv');
      if (notes.length > 0) {
        $('<button/>', { class: 'clearme', css: { marginBottom: '1.5rem', padding: '' } })
          .prependTo('#innerNotesDiv')
          .text('Invia email promemoria a clienti')
          .off('click')
          .on('click', () => {
            showConsultaMessage(
              'Invia il promemoria per questo giorno?',
              'giorno: ' + date,
              () => mkCall(
                'POST',
                { action: 'promemoria', data: datetime },
                res => {
                  showMessage('Emails sent!');
                },
                res => {
                  showMessage(messageError);
                }
              ),
              () => $('#close-modal').click(),
              true
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
  $('#prenota').off('click').on('click', () => {
    // if (!$('#from').val()) return showMessage('selezionare una data');
    // const d = $('#from').flatpickr('getValue');
    const d = fp.selectedDates[0]
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
    validateData(data, validation).then(r => {
      if (!r) return;
      if (pid) { // user is modifying, cancel previous reservation:
        data.oldID = pid.split('_')[0];
      }
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
          window.location.href = url + (pid ? '_modificata' : '');
        },
        res => {
          showMessage(messageError);
        }
      );
    });
  });

  // https://flatpickr.js.org/ (choosen)
  // https://xdsoft.net/jqplugins/datetimepicker/ (previously chosen)
  const fp = jQuery('#from').flatpickr({
    locale: 'it',
    minDate: 'today',
    dateFormat:'Y-m-d',
    disable: dates || [],
    disableMobile: true,
    onChange: (dp, input) => {
      $('#loading').show();
      $('#from').chosen = true;
      input.chosenn = true;
      fp.close();
      dp[0].setHours(12);
      updateShifts(dp[0]);
    },
  });
  fp.set('dateFormat', 'd/M/Y');
  $('#privacy2').on('click', () => {
    showMessage('I dati vengono utilizzati solo per gestire la prenotazione e contattarti tramite email (assicurati non finisca nella spam) o telefono in caso di problemi o chiusura inaspettata del locale (es. causa maltempo).');
  });
  const validation = new JustValidate('#form')
    .addField('#name', [
      {
        rule: 'required',
        errorMessage: 'inserire un nome'
      }
    ])
    .addField('#surname', [
      {
        rule: 'required',
        errorMessage: 'inserire un cognome'
      }
    ])
    .addField('#telephone', [
      {
        rule: 'required',
        errorMessage: 'inserire un telefone'
      }
    ])
    .addField('#from', [
      {
        rule: 'required',
        errorMessage: 'scegli una data'
      }
    ])
    .addField('#quantity', [
      {
        rule: 'required',
        errorMessage: 'indicare il numero di persone'
      }
    ])
    .addField('#privacy', [
      {
        rule: 'required',
        errorMessage: 'è necessario accettare i termini e le condizioni'
      }
    ])
    .addField('#shiftGridL', [
      {
        rule: 'required',
        errorMessage: 'Seleziona il turno.',
        validator: () => {
          const shiftId = $($('.aShift').filter((i, ii) => $(ii).attr('bselected') == 'true')[0]).attr('bindex');
          const res = shiftId !== undefined;
          return res;
        }
      }
    ])
    .addField('#email', [
      {
        rule: 'required',
        errorMessage: 'L\'e-mail è necessaria',
      },
      {
        rule: 'email',
        errorMessage: 'L\'e-mail non è valida!',
      },
    ]);
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
      if (shifts_.length === 0)
        return showMessage(`Non abbiamo ancora pianificato i turni per questa data. Vi preghiamo di contattarci: ${telString} ${messengerString}`);
      const shifts = mkShiftButtons(shifts_, selected);
      mkQuantityOptions(shifts, people);
    },
    res => showMessage(messageError)
  );
}

function mkShiftButtons (shifts, selected) {
  const sButtons = [];
  const removeShifts = [];
  shifts.forEach((s, i) => {
    const max_available = s.online_seats_limit - s.booked_seats_in_shift;
    if (max_available <= 0) {
      return removeShifts.push(i);
    }
    for (table in s.tables) {
      if (s.tables[table] > max_available) {
        delete s.tables[table];
      }
    }
    s.table_sizes = Object.values(s.tables);
    if (s.table_sizes.length === 0) {
      return removeShifts.push(i);
    }
    // const b = $('<button/>', { id: 'bShift' + i, class: 'success bShift', css: { margin: 0, padding: '2%', width: '90%' } })
    const b = $('<a/>', { id: 'aShift' + i, class: 'small button aShift' })
      .text(s.name)
      .appendTo(
        // $('<li/>', { css: { margin: 0, padding: 0, 'text-align': 'center' } })
        $('<li/>', { class: 'bShift' })
          .appendTo('#shiftGrid')
      );
    b.bcolor = b.css('background-color');
    b.attr('bindex', s.id);
    sButtons.push(b);
  });
  removeShifts.reverse().forEach(i => shifts.splice(i, 1));
  if (shifts.length === 0)
      showMessage('In questa data siamo al completo.');
  sButtons.forEach(b => {
    b.click(() => {
      sButtons.forEach(bb => {
        bb.attr('bselected', false);
        if (bb.css('pointer-events') !== 'none')
          bb.css('background', bb.bcolor);
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
  $('#new').hide();
  $('.form').hide();
  $('#prenotaDiv').show();
  let modified = false;
  if (pid.endsWith('_modificata')) {
    $('#ttitle').text('Prenotazione modificata. Grazie');
    $('#tlegend').text('Dettagli della prenotazione modificata');
    pid = pid.split('_modifica')[0];
  }
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
  const extra = loadExtra(r);

  // const date = new Date(r.booked_for);
  // const date2 = new Date(date.getTime() + r.duration * 60000);
  const { date, date2 } = getBookingTimes(r);

  const h = (id, info) => $('#' + id).text(info);
  h('name', bc.first_name + ' ' + bc.last_name);
  h('telephone', extra.telephone);
  h('email', extra.email);
  h('day', date.toLocaleString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  h('time1', time(date));
  h('time2', time(date2));
  h('people', r.people);
  h('note', extra.note);
  const s = extra.seggiolini;
  h('segg', s == 0 ? 'No' : s);
  h('dog', extra.cani ? 'Sì' : 'No');
  $('#modify').click(() => {
    const pid = new URL(window.location.href).searchParams.get('id').split('_modificata')[0] + '_modifica';
    window.location.href = window.location.href.split('/').reverse().slice(1).reverse().join('/') + '/index.html?id=' + pid;
  });
  const pid = r.id;
  $('#cancel').click(() => {
    showConsultaMessage(
      'Vuoi cancellare la prenotazione?',
      '',
      () => {
        mkCall(
          'POST',
          { action: 'cancelReservation', data: pid },
          res => {
            $('#ttitle').text('Prenotazione cancellata. Grazie');
            $('tlegend').text('Dettagli prenotazione cancellata');
            // $('<li/>').appendTo('#infoList').html(`<b>Status</b>: Cancellata`).css('background', 'pink');
            $('#no').click();
            $('#modify').hide();
            $('#cancel').hide();
            $('#new').show();
          },

          //pid e ti serve tienilo, ma nascondilo a tutti gli altri. non è user friendly e se un cliente ci chiama e ci da il pid noi non sappiamo cosa rispondere...
          res => {
            showMessage(`${messageError}
              La ID della prenotazione è: ${pid}.`);
          }
        );
      },
      () => {
        $('#close-modal').click()
      }
    );
  });
}

function validateEmail (email) {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

function validateData (data, validation) {
  return validation.revalidate().then(() => {
    // $('.error').attr('style', 'border: solid 1px #ccc');
    // $('.error1').hide()
    // $('#notification').hide();
    const messages = [];
    const ids = [];
    if (!$('#from').val()) {
      ids.push('#from');
    }
    if (data.date === '') {
      ids.push('#from1');
    }
    if (data.quantity == 0) {
      ids.push('#quantity1');
    }
    if (data.shiftId === undefined) {
      ids.push('#shiftGrid1');
    }
    if (data.name === '') {
      ids.push('#name1');
    }
    if (data.surname === '') {
      ids.push('#surname1');
    }
    if (!validateEmail(data.email)) {
      ids.push('#email1');
    }
    if (data.telephone === '') {
      ids.push('#telephone1');
    }
    if (!$('#privacy').prop('checked')) {
      ids.push('#privacy3');
    }
    if (ids.length > 0) {
      ids.forEach(i => showError(i));
      // asdoiajds = aosidjasid
      // showMessage(messages.join('<br>'));
      return false;
    }
    return true;
  });
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

function showConsultaMessage (message, message2, callYes, callNo, index) {
  $('#yes').off('click').on('click', callYes);
  $('#no').off('click').on('click', callNo);
  $('#modalLead2').html(message);
  $('#modalText').html(message2);
  $('#myModal' + (index ? '2' : '')).foundation('reveal', 'open');
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
  const cssOn = { 'pointer-events': '', cursor: 'pointer', background: '#ce2f24' };
  const cssOff = { 'pointer-events': 'none', cursor: 'default', background: '#ce9f94' };
  $('#quantity').off('input').on('input', function() {
    const v = Number($(this).val());
    shifts.forEach((s, i) => {
      const tablesOk = s.table_sizes.filter(t => t >= v);
      const css = tablesOk.length === 0 ? cssOff : cssOn;
      $('#aShift' + i).css(css).attr('bselected', false);
    });
    // should not happen because if a quantity is available
    // there is a shift with a table for it:
    const totalDisabled = shifts.reduce((c, i, ii) => {
      const isDisabled =  $('#aShift' + ii).css('pointer-events') === 'none';
      return c + isDisabled;
    }, 0); 
    if (totalDisabled === shifts.length) return showMessage(message10);
    $('#notification').hide();
  });
  if (people) {
    $('#quantity').val(people);
  }
}

function showError (id) {
  $(id.replace('1', '')).attr('style', 'border: 2px solid red !important');
}

const time = d => d.toLocaleString('it-IT', { hour: '2-digit', minute:'2-digit' });
function getBookingTimes (b, timed) {
  const date = new Date(b.booked_for);
  const date2 = new Date(date.getTime() + b.duration * 60000);
  if (timed) {
    return { t: time(date), t2: time(date2) };
  }
  return { date, date2 };
}
