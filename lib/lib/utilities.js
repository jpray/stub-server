
export function applyWildcards(route, patterns){

  if (!patterns || patterns.length === 0) {
    return route;
  }

  var parts = route.split('/');

  patterns.forEach(function(pattern) {
    var regex = new RegExp(pattern[0]);
    parts = parts.map(function(part){
      if (regex.test(part)) {
        return pattern[1];
      } else {
        return part;
      }
    })
  })

  return parts.join('/');  
}

export function ensureJSONExtension(aString) {
  if (aString.length > 0 && aString.indexOf('.json') === -1) {
    return aString+'.json';
  }
  return aString;
}

export function stripTrailingSlash(aString) {
  if (!aString) {
    return aString;
  }
  let lastChar = aString.substr(-1); 
  if (lastChar === '/') {       
     return aString.slice(0,-1);
  }
  return aString;
}

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

export function getSessionIdFromReq(req) {
    var cookies = parseCookies(req);
    return cookies.stubServerSessionId;
}

export function processDemoRequestArg(req) {
  return {
    //url: req.url,
    //method: req.method,
    query: req.query,
    body: req.body
  };
}