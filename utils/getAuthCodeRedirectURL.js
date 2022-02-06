let _qs = require("qs"); // Will need to 'npm install qs'

module.exports = function (
    clientId,
    redirectUri,
    scopeList,
    state,
    code_challenge,
    code_challenge_method,
    code_verifier,
    authorizationURI
) {
  let scope = scopeList.join(" ");
  let loginQS = {
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scope,
    state: state,
    code_challenge,
    code_challenge_method,
    code_verifier
  };

  let stringifyLoginQS = _qs.stringify(loginQS);
  return authorizationURI + "?" + stringifyLoginQS;
};