const axios = require('axios');
const querystring = require('querystring');
// Application environment virables
const {cashtokenClientID, cashtokenAuthorizationURI, grantType, cashTokenTokenURI, cashTokenUserInfoURI, cashtokenRedirectURI, codeChallengeMethod, cashTokenSignoutURI, snapchatClientID,snapchatRedirectURL, snapchatAuthorizationURI, snapchatTokenURI, snapchatUserInfoURI, protocol} = require('../config');

// Generation of 0Auth code challenge
const generate_code_challenge = require('../utils/generateCodeChallenge')
// Genaration of redirection URIs with associated query strings
const getAuthCodeRedirectURL = require('../utils/getAuthCodeRedirectURL')
// Genration of client state for bot cashtoken and snapchat authenticator
const generateClientState = require('../utils/generateRandomBytes')
// Generation of application URI
const generateURI = require('../utils/generateURI')

// generate state for snap chat
const snapchatState = generateClientState();
// generate state for cash token
const cashtokenState = generateClientState();
let userAccessToken;
let userIDToken;
let cashtokenCodeChallenge;
let cashtokenCodeVerifier;
let snapchatCodeChallenge;
let snapchatCodeVerifier;

// application logic for home page
exports.home = (req, res) => {
    //generate code challenge and code verifier for cashtoken authentication
    if (!cashtokenCodeChallenge) {
      ({code_challenge: cashtokenCodeChallenge, code_verifier: cashtokenCodeVerifier} = generate_code_challenge())
    }

    //generate code challenge and code verifier for snapchat authentication
    if (!snapchatCodeChallenge){
        ({code_challenge: snapchatCodeChallenge, code_verifier: snapchatCodeVerifier} = generate_code_challenge())
    }

    // To indicate success or failure of user attempt to login
    const {successful} = req.query;

    // generate snapchat authorization endpoint URI
    const snapchatAuthURI = generateURI('auth/snapchat', req, protocol);
    // generate cashtoken authorization endpoint URI
    const cashtokenAuthURI = generateURI('auth/cashtoken', req, protocol)
    // render the home page
    res.render('pages/index', {cashtokenAuthURI, snapchatAuthURI, successful})
}

// application logic for user profile
exports.userProfile = async (req, res) => {
    const {authType} = req.query;

    const dashboardURI = generateURI('dashboard', req, protocol);

    if(authType === "cashtoken") {
      const userProfile = await axios.get(cashTokenUserInfoURI, {headers: {
        'Authorization': `Bearer ${userAccessToken}`
      }})
  
      if (userProfile.status !== 200) {
        
      }
      res.render('pages/profile.ejs', {
      email: userProfile.data.email,
      display_name: userProfile.data.display_name,
      gender: userProfile.data.gender,
      first_name: userProfile.data.first_name,
      last_name: userProfile.data.last_name,
      username: userProfile.data.username,
      dashboardURI
      })
    } else {
      const userProfile = await axios.post(snapchatUserInfoURI, {query: "{me{displayName bitmoji{avatar} externalId}}"}, {headers: {
        'Authorization': `Bearer ${userAccessToken}`
      }})
      if(userProfile.status !== 200) {
        res.redirect(`/dashboard?successful=false`)
      } else {
        const {data} = userProfile.data;

        res.render('pages/profile.ejs', {
        avatar: data.me.bitmoji.avatar || 'https://res.cloudinary.com/at-health/image/upload/v1640870504/ATHEALTH/Images/aeqeerxhz0lxxev9k7zw.png',
        displayName: data.me.displayName,
        dashboardURI,
        email: null
      })
    
    }
    }
}

// application logic for user dashboard
exports.dashboard = (req, res) => {
    const {login = false, authType = null, successful = true} = req.query;
    const userInfoURI = generateURI(`user_profile/?authType=${authType}`, req, protocol);
    const logoutURI = authType === 'cashtoken' ? cashTokenSignoutURI : generateURI('signout', req, protocol)
  res.render('pages/dashboard.ejs', {userInfoURI, logoutURI, login,successful})
}

// application logic for snapchat authorization
exports.snapchatAuth = async (req, res) => {
  //generate code challenge and code verifier for snapchat authentication
  if (!snapchatCodeChallenge) {
      ({code_challenge: snapchatCodeChallenge, code_verifier: snapchatCodeVerifier} = generate_code_challenge())
  }
  let snapchatScopeList = [
    "https://auth.snapchat.com/oauth2/api/user.display_name",
    "https://auth.snapchat.com/oauth2/api/user.bitmoji.avatar",
  ];
  
   // generate snapchat authorization URL
  const authorizationtURL = getAuthCodeRedirectURL(
    snapchatClientID,
    snapchatRedirectURL,
    snapchatScopeList,
    snapchatState,
    snapchatCodeChallenge,
    codeChallengeMethod,
    snapchatCodeVerifier,
    snapchatAuthorizationURI
  );

  // Redirect user to get consent
  res.redirect(authorizationtURL);
}

// application logic for cashtoken authorization
exports.cashtokenAuth = async (req, res) => {
 //generate code challenge and code verifier for cashtoken authentication
  if (!cashtokenCodeChallenge) {
    ({code_challenge: cashtokenCodeChallenge, code_verifier: cashtokenCodeVerifier} = generate_code_challenge())
  }

  const cashtokenScopes = ['openid', 'email', 'profile']
   // generate cashtoken authorization URL
  const authorizationtURL = getAuthCodeRedirectURL(
    cashtokenClientID,
    cashtokenRedirectURI,
    cashtokenScopes,
    cashtokenState,
    cashtokenCodeChallenge,
    codeChallengeMethod,
    cashtokenCodeVerifier,
    cashtokenAuthorizationURI
  );

  // Redirect user to get consent
  res.redirect(authorizationtURL);
}

// application logic for cashtoken and snapchat callback URI 
exports.callback = async (req, res) => {
  const {code, state: authState, snapchat} = req.query;
    if (snapchat) {
      await handleCallback({
      client_id: snapchatClientID,
      state: authState,
      code,
      grant_type:grantType,
      redirect_uri: snapchatRedirectURL,
      code_verifier: snapchatCodeVerifier
      }, snapchatState, authState, snapchatTokenURI, res, "snapchat")
    } else {
        await handleCallback({
        client_id: cashtokenClientID,
        state: authState,
        code,
        grant_type:grantType,
        redirect_uri: cashtokenRedirectURI,
        code_verifier: cashtokenCodeVerifier
      }, cashtokenState, authState ,cashTokenTokenURI, res, "cashtoken")
    }
}

// application logic for snapchat user logout
exports.logout = async (req, res) => {
  /**
   * TODO: Revoke user access token before loging out
   */
  res.redirect('/?logout=true')
}

async function handleCallback(data, state, authState, tokenURI, res, authType) {
  if (state !== authState) {
        res.redirect('/?successful=false')
    }

  const userTokens = await axios.post(tokenURI, querystring.stringify(data));

    if (userTokens.status === 200) {
      const {access_token, id_token} = userTokens.data
      userIDToken = id_token;
      userAccessToken = access_token
      res.redirect(`/dashboard?login=true&authType=${authType}`)
    } else {
      res.redirect('/?successful=false')
    }
}