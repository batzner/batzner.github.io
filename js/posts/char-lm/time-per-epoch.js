'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

printEpochTimes('batch_size', [1, 10, 20, 50, 100, 200, 500, 2000]);
printEpochTimes('num_timesteps', [40, 80, 120, 160]);
printEpochTimes('south_park', ['2017-01-18T10-32-14', 'num_timesteps/200/2017-01-18T13-56-50']);
printEpochTimes('num_neurons', ['512', '1024']);

function printEpochTimes(parameter, values) {
    values.map(function (value) {
        // get the data and push the trainstates
        return $.getJSON('assets/posts/char-lm/data/' + parameter + '/' + value + '/model.trainstate.json').then(function (trainstate) {
            var log = PostUtil.getPreprocessedLog(trainstate.log);

            var maxEpoch = Math.max.apply(Math, _toConsumableArray(log.epochs.values()));
            if (maxEpoch == 1) maxEpoch = 2;

            var allowedSteps = Array.from(log.epochs.keys()).filter(function (step) {
                return log.epochs.get(step) < maxEpoch;
            });
            var maxStep = Math.max.apply(Math, _toConsumableArray(allowedSteps));

            // Filter the steps to exclude the last (possibly incomplete) epoch
            var secondsSteps = Array.from(log.secondsSinceStart.keys()).filter(function (step) {
                return step <= maxStep;
            });
            var totalSeconds = log.secondsSinceStart.get(Math.max.apply(Math, _toConsumableArray(secondsSteps)));

            console.log(value, totalSeconds / ((maxEpoch - 1) * 60) + ' minutes');
        });
    });
}