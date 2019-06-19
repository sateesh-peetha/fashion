function get_ios_url (referral_code){
    return "https://gigi-asia-buyer.test-app.link/invite?referral_code="+referral_code;
}
function get_android_url(referral_code){
    return "https://gigi-asia-buyer.test-app.link/invite?referral_code="+referral_code;
}

module.exports = {
    get_ios_url:get_ios_url,
    get_android_url:get_android_url
}