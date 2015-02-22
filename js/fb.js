  jQuery(document).ready(function() {
      // Fetch Facebook Likes once and every 30 seconds thereafter
      // Adjust setInterval to either fetch content in different frequency or remove to only fetch once.
      realtime_fb_likes();
      setInterval("realtime_fb_likes()", 30000);
  });

  // Fetch FB Likes
  // Replace "Starbucks" with your Facebook Profile/Page ID, or full external website address.
  // Get FB ID here:  http://graph.facebook.com/your_page_name
  function realtime_fb_likes() {
      $.getJSON('http://graph.facebook.com/cavecchiabeerstrot/', function(data) {
          var fb_likes = addCommas(data.likes);
          $('#fb-likes-count').text(fb_likes);
      });
  }

  // Pretty number format to add commas between numbers
  // Source: http://www.mredkj.com/javascript/nfbasic.html
  function addCommas(nStr) {
      nStr += '';
      x = nStr.split('.');
      x1 = x[0];
      x2 = x.length > 1 ? '.' + x[1] : '';
      var rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
          x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
  }