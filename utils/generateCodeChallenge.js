const crypto = require('crypto');
const base64url = require('base64url');

function generateCode () {
    const random = "wufhviyrjkdirufjjfyrjfufjfufufjfjj"
    const code_verifier = base64url.encode(random)
    const hash = crypto.createHash('sha256').update(code_verifier).digest();
    const code_challenge = base64url.encode(hash)
    return {code_challenge, code_verifier}
}

module.exports = generateCode;