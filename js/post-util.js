'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PostUtil = function () {
    function PostUtil() {
        _classCallCheck(this, PostUtil);
    }

    _createClass(PostUtil, null, [{
        key: 'generateUUID',
        value: function generateUUID() {
            var d = new Date().getTime();
            if (window.performance && typeof window.performance.now === "function") {
                d += performance.now(); //use high-precision timer if available
            }
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : r & 0x3 | 0x8).toString(16);
            });
            return uuid;
        }
    }, {
        key: 'getRandomCharacter',
        value: function getRandomCharacter() {
            var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            return alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }
    }, {
        key: 'getRandomSentence',
        value: function getRandomSentence(length) {
            var text = "";
            for (var i = 0; i < length; i++) {
                text += PostUtil.getRandomCharacter();
                // Append a space every 6 characters on average
                if (Math.random() < 0.1667) {
                    text += ' ';
                }
            }
            return text;
        }
    }, {
        key: 'objectValues',
        value: function objectValues(obj) {
            return Object.keys(obj).map(function (key) {
                return obj[key];
            });
        }
    }, {
        key: 'replaceClosestKeys',
        value: function replaceClosestKeys(map, dictionary) {
            // Creates a new Map with the values of dictionary as keys. Keys of obj and dictionary
            // must be integers.
            var result = new Map();
            var keys = Array.from(dictionary.keys());
            map.forEach(function (value, key) {
                var closestKey = Math.min.apply(Math, _toConsumableArray(keys.filter(function (k) {
                    return k >= key;
                })));
                result.set(dictionary.get(closestKey), value);
            });
            return result;
        }
    }, {
        key: 'getPreprocessedLog',
        value: function getPreprocessedLog(log) {
            // Preprocess the log of a trainstate
            var result = {};

            // Convert the step keys to maps with integer keys
            Object.keys(log).forEach(function (seriesKey) {
                result[seriesKey] = PostUtil.parseSeriesToIntMap(log[seriesKey]);
            });

            // Exponentiate the losses to perplexities
            ['lossesTrain', 'lossesValid'].forEach(function (seriesKey) {
                var series = result[seriesKey];
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = series.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var entryKey = _step.value;

                        series.set(entryKey, Math.pow(2, series.get(entryKey)));
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            });

            // Split up the epochs into floating point epochs
            var epochRanges = {};
            result.epochs.forEach(function (epoch, step) {
                if (!epochRanges[epoch]) {
                    epochRanges[epoch] = { min: step, max: step };
                } else if (step < epochRanges[epoch].min) {
                    epochRanges[epoch].min = step;
                } else if (step > epochRanges[epoch].max) {
                    epochRanges[epoch].max = step;
                }
            });
            result.epochs.forEach(function (epoch, step) {
                var min = epochRanges[epoch].min;
                var max = epochRanges[epoch].max;
                var progress = max != min ? (step - min) / (max - min) : 0;
                result.epochs.set(step, epoch + progress);
            });

            // Create a new series secondsSinceStart out of the intervalSeconds
            result.secondsSinceStart = new Map();
            result.minutesSinceStart = new Map();
            var currentSeconds = 0;
            Array.from(result.intervalSeconds.keys()).sort(function (a, b) {
                return a - b;
            }).forEach(function (step) {
                currentSeconds += result.intervalSeconds.get(step);
                result.secondsSinceStart.set(step, currentSeconds);
                result.minutesSinceStart.set(step, currentSeconds / 60);
            });
            return result;
        }
    }, {
        key: 'getYRange',
        value: function getYRange(datasets) {
            var range = { min: null, max: null };
            datasets.forEach(function (dataset) {
                dataset.data.forEach(function (point) {
                    range.min = range.min != null ? Math.min(range.min, point.y) : point.y;
                    range.max = range.max != null ? Math.max(range.max, point.y) : point.y;
                });
            });
            return range;
        }
    }, {
        key: 'parseSeriesToIntMap',
        value: function parseSeriesToIntMap(series) {
            var parsed = new Map();
            Object.keys(series).forEach(function (key) {
                parsed.set(parseInt(key), series[key]);
            });
            return parsed;
        }
    }, {
        key: 'placeCaretAtEnd',
        value: function placeCaretAtEnd(el) {
            // See http://stackoverflow.com/questions/4233265/contenteditable-set-caret-at-the-end-of-the-text-cross-browser
            el.focus();
            if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                var range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (typeof document.body.createTextRange != "undefined") {
                var textRange = document.body.createTextRange();
                textRange.moveToElementText(el);
                textRange.collapse(false);
                textRange.select();
            }
        }
    }, {
        key: 'clearChart',
        value: function clearChart(id) {
            var oldCanvas = $('#' + id);
            // ChartJS modifies the canvas width and height attributes, so we need to store them in data
            var width = oldCanvas.data('width');
            var height = oldCanvas.data('height');
            var classes = oldCanvas.attr('class');
            var newCanvas = $('<canvas>').data('width', width).data('height', height).attr('width', width).attr('height', height).attr('class', classes).attr('id', id);
            oldCanvas.parent().empty().append(newCanvas);
        }
    }]);

    return PostUtil;
}();

PostUtil.CHART_COLORS_DIVERSE = ['#fe819d', '#2196F3', '#ffce56', '#9575CD', '#e0846b', '#5f8ca1', '#626a61', '#A9A9A9', '#C5CAE9'];
PostUtil.CHART_COLORS_BLUE = ['#BBDEFB', '#64B5F6', '#2196F3', '#1565C0', '#133270', '#172237'];
PostUtil.CHART_COLORS_INDIGO = ['#C5CAE9', '#7986CB', '#3F51B5', '#283593', '#1e2868', '#121424'];
PostUtil.CHART_COLORS_DEEP_PURPLE = ['#D1C4E9', '#9575CD', '#673AB7', '#4527A0', '#2e185d', '#121424'];
PostUtil.CHART_COLORS_RED = ['#FFCDD2', '#E57373', '#F44336', '#C62828', '#721414', '#340707'];
PostUtil.CHART_COLORS_GREEN = ['#C8E6C9', '#81C784', '#4CAF50', '#2E7D32', '#123317', '#0a1a0d'];