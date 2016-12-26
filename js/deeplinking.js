function getMobileOperatingSystem() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;

      // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }

    return "unknown";
}

function onLoad() {
    var urlLink1 = "https://www.instagram.com/beerstrot";
    var urlLink2 = "https://www.twitter.com/beerstrot";
    var urlLink3 = "https://www.facebook.com/cavecchiabeerstrot";
    switch (getMobileOperatingSystem()) {
        case 'Android':
            urlLink1 = "instagram://user?username=beerstrot";
            urlLink2 = "twitter://user?username=beerstrot";
            urlLink3 = "fb://profile/cavecchiabeerstrot";
            break;
        case 'iOS':
            urlLink1 = "instagram://user?username=beerstrot";
            urlLink2 = "twitter://user?username=beerstrot";
            urlLink3 = "fb://profile/cavecchiabeerstrot";
            break;
        default:
            break;
    }
    document.getElementById('yourLink1').setAttribute('href', urlLink1);
    document.getElementById('yourLink2').setAttribute('href', urlLink2);
    document.getElementById('yourLink3').setAttribute('href', urlLink3);
}
window.onload = onLoad;