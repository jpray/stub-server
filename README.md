# `stub-server`

## Features
   - Allows creation of 'presets', which are saved configurations of active stubs
   - Exposes API for usage with tests
   - Watches stub directory for changes, and always shows the updated stub
   - Uses proxy middleware to allow user to hit other servers while running their UI app locally

## Quick Start

### Terms

- Stub: a JSON file that gets served for a given endpoint instead of a real application server response
- Preset: a named collection of stubs 

### Using the GUI

Navigate to `/services`. Here you will be able to set the active stub for each route.
   - The first dropdown selects your environment. ([Jump to Environment Configuration](#environment-configurations))  Note: Due to a limitation in the proxy middleware when switching from one proxied environment (anything other than "local") to another, restart stub-server after making the selection.
   - The "**Select a Preset**" dropdown changes the active preset.
   - The "**Start Preset Recording**" button starts recording all traffic that is passing through the proxy middleware.  The "Finish Recording & Save Preset" button stops recording and saves the latest response for each proxied url & action as a preset.  You must enter a preset name for the preset to be saved.
   - The "**Save Current Config as Preset**" button will save a preset from the current active stubs.  Active stubs can be selected from the corresponding dropdown for each url/action. You must enter a preset name for the preset to be saved.


### Environment Configurations

By default, `stub-server` expects your environment configurations to be in `/server/local/environments`.

With environment configurations, you can configure proxy server middleware to map local paths to a remote paths.  Here is an example setup.

/server/local/environments/local.json
```
[
  {
    "path": "/foo",
    "target": "local"
  }
]
```

/server/local/environments/unit.json
```
[
  {
    "path": "/foo",
    "target": "https://my2.unit.foo.com"
  }
]
```

/server/local/environments/some-developers-machine.json
```
[
  {
    "path": "/foo",
    "target": "http://wp3werw232:8080"
  }
]
```

### Stubs

By default, `stub-server` expects your stubs to be in `/server/local/stubs`.

### Presets

By default, `stub-server` expects your presets to be in `/server/local/presets`.

You can create presets in two ways:

   1. In the interface, set all of the stubs to their desired positions. At the top of the page, enter a name
   for the preset and click 'Save config as preset'. You should now see your preset in the presets dropdown
    
   2. Create a new json file in the presets directory. As soon as the file is added, you should see it in
   the presets dropdown.


### HTTP Status Codes

Within your stub file JSON, if you add this property to the base object, the stub server will return the response with the indicated status code.  The @@HTTP_STATUS will be removed before it is sent.
```
{
  "@@HTTP_STATUS": "500",
  ...
}
```

### Hooks

If you want to add some logic to dynamically select or modify the stub that gets returned, you can define a hooks file.  To use hooks, first create a stub that will act as the default response (ie. `/ws/ers/save/POST/default.json`).  Then create the hooks file for this stub `/ws/ers/save/POST/default.hooks.js`.  Here is an example hooks file:

```
/**
 * if userName is being POSTed, return default.json, else return error.json
 * @param {obj} req - the HTTP request object
 * @return {string} - the name of the stub to be served
 */
exports.chooseStub = function(req) {
  return req.body.userName ? 'default' : 'error';
}

/**
 * if user is Bert, add something special to the response for him
 * @param {obj} stub - the javascript object for the stub
 * @param {obj} req - the HTTP request object
 * @return {obj} - the new javascript object to be served
 */
exports.processStub = function(stub, req) {
  if (req.body.userName === 'Bert') {
    stub.somethingSpecialForBert = 'foo';
  }
  return stub;
}
```

Hook files should be written using commonJS module syntax and ES5 to ensure compatibility.  

### URL Wildcard Patterns (BETA)

Some urls can have segments that are highly dynamic such as a session ID or plan ID.  To promote reuse of stubs and avoid bloat, such portions can be replaced within stub-server with a placeholder.  Currently these placeholders are hardcoded for specific use-cases but they will be exposed in an upcoming release.  Get in touch if you want to use this feature now.

## Development

DEV NOTE: This package is ES2015/ES2016, it must be compiled before release. `npm run prepublish`.

### Usage

In your project
```
$ npm install git+ssh://git@github.com:jpray/stub-server.git
```

`stub-server` will automatically create the `/server/local` directory in your project.

### Plain JS

`stub-server` returns a `Promise` when invoked. This promise is resolved when the server has successfully started.

`@param config.port` port number to run on.

`@param config.paths` static paths to serve.

`@param callback` optional, with signature of `(error, server)`, where `server` is an instance of the express server.

```js
var server = require('stub-server');

server({port: 9000, paths: ['.']});
```

### Gulp
```js
var server = require('stub-server');

// dev server
gulp.task('server', function () {
    return server({port: 9000, paths: ['.']});
})

// dist server
gulp.task('server:dist', function () {
    return server({port: 9000, paths: ['./dist']});
});
```

## Endpoint documentation

You shouldn't ever need to directly call any of the endpoints -- use the interface instead.
But here is the documentation.

#### `GET /services`

Shows the mock services index

#### `GET /services/setStub`

Sets the default stub for a route

`@param route` the route to configure

`@param stub` the name of the stub to make default

#### `GET /services/setPreset`

Applies a preset. Selects all stubs defined in the preset.

`@param name` the name of the preset to apply

#### `GET /services/reset`

Resets all active stubs to their original values.

#### `POST /services/createPreset`

Creates a preset with the current stub configuration. Saves it in `/server/local/presets`

`@param name` the desired name for this stub
