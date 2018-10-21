import fs from 'fs';
import apply from './async-apply';
import path from 'path';
import extend from 'extend';

import {STUB_PATH} from '../lib/constants';

const TYPES = ['GET', 'POST', 'PUT', 'DELETE'];

export default async function getRoutes(dir) {
    dir = dir || '';

    var files = await apply(fs.readdir, path.join(STUB_PATH, dir));
    var routes = {};
    for (var i=0; i<files.length; i++) {
        var file = files[i];

        if (file[0] === '.' || file.indexOf('.hooks.js') !== -1) {
            //avoid hanging issue caused by .DS_Store files on mac machines
            //ignore .hooks.js files
            continue;
        }
        
        if (!!~TYPES.indexOf(file.toString())) {
            routes[[dir, file].join('/')] = await apply(fs.readdir, path.join(STUB_PATH, dir, file));
        } else {
            extend(routes, await getRoutes([dir, file].join('/')));
        }
    }

    return routes;
}
