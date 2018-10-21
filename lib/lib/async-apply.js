export default function asyncApply(fn/*, args...*/) {
    var args = Array.prototype.slice.call(arguments,1);
    return new Promise(function (resolve, reject) {
        args.push(function (err, res) {
            if (err) {
                return reject(err);
            }
            return resolve(res);
        });

        fn.apply(null, args);
    })
}
