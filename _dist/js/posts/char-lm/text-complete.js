'use strict';

var ANIMATE_INTERVAL_MILLIS = 50;
var DATASET_DEFAULTS = {
    wiki: {
        steps: 500,
        maxSentences: 3,
        prime: 'The'
    },
    congress: {
        steps: 500,
        maxSentences: 50,
        prime: 'The'
    },
    southPark: {
        steps: 500,
        maxSentences: 3,
        prime: 'Kenny'
    },
    sherlock: {
        steps: 500,
        maxSentences: 3,
        prime: 'Suddenly'
    },
    goethe: {
        steps: 500,
        maxSentences: 50,
        prime: 'Der'
    }
};

// Pseudo-constant jquery elements (constant within the scope of the post)
var TEXT_INPUT = $('.text-input');
var TEXT_OUTPUT = $('.text-output');
var TEXT_BRIDGE = $('.text-input-output-bridge');
var TALK_BOX_HEADING = $('.talk-box-heading');
var DATASET_DROPDOWN = $('#talk-box-dataset-dropdown');

var selectedDataset = null;
var pendingRequestId = null;
var result = null;

// MAIN Function
$(function () {
    TEXT_INPUT = $('.text-input');
    TEXT_OUTPUT = $('.text-output');
    TEXT_BRIDGE = $('.text-input-output-bridge');
    TALK_BOX_HEADING = $('.talk-box-heading');
    DATASET_DROPDOWN = $('#talk-box-dataset-dropdown');

    selectedDataset = null;
    pendingRequestId = null;
    result = null;
    selectDataset('wiki');
});

// TODO: Stop the animation on an exception

function selectDataset(name) {
    // If name == null, the event comes from the dropdown.
    selectedDataset = name == null ? DATASET_DROPDOWN.find('.dropdown-toggle').val() : name;

    // Update the normal talk box
    TALK_BOX_HEADING.find('button.active').removeClass('active');
    TALK_BOX_HEADING.find('button[value="' + selectedDataset + '"]').addClass('active');

    // Update the mobile talk box
    var dropdownItem = DATASET_DROPDOWN.find('a[data-value="' + selectedDataset + '"]');
    selectDropdownItem(dropdownItem, false);

    TEXT_INPUT.html(DATASET_DEFAULTS[selectedDataset].prime);
    TEXT_OUTPUT.html('');
    focusOnInput();
}

function onInput() {
    // Interpret an enter stroke at the end as a send click.
    var input = getCleanInput();
    if (input.indexOf('\n') >= 0) {
        // Remove the new lines
        TEXT_INPUT.html(input.replace('\n', ''));
        completeText();
    } else if (TEXT_OUTPUT.html().length) {
        // If we didn't start a new request and the TEXT_OUTPUT contains text, erase it.
        TEXT_BRIDGE.hide();
        // Shrink the text box height slowly
        TEXT_OUTPUT.slideToggle({
            start: function start() {
                return TEXT_OUTPUT.html('');
            },
            always: function always() {
                return TEXT_OUTPUT.show();
            }
        });
    }
}

function getCleanInput() {
    var input = TEXT_INPUT.html();
    // Replace divs without a br tag with new lines
    input = input.replace(/<div>(?!<br)/g, '<div><br/>');
    // Replace new lines and
    input = input.replace(/<br ?\/?>/g, '\n');
    // Remove html tags (< will be escaped to &lt; anyways).
    input = input.replace(/<\/?\w*?\/?>/g, '');
    // Unescape html entities
    input = he.decode(input);
    return input;
}

function completeText() {
    $('#send-button').focus();
    var prime = $.trim(getCleanInput());
    if (!prime.length) return;

    var requestId = PostUtil.generateUUID();
    pendingRequestId = requestId;
    animateWaiting(requestId);

    console.log('Sending request', prime);
    var defaultParams = DATASET_DEFAULTS[selectedDataset];
    $.get('http://ec2-35-167-199-162.us-west-2.compute.amazonaws.com:5000/sample', {
        prime: prime,
        steps: defaultParams.steps,
        maxSentences: defaultParams.maxSentences,
        datasetName: selectedDataset
    }).then(function (sampled) {
        if (pendingRequestId == requestId) {
            result = sampled;
            pendingRequestId = null;
        }
    });
}

function getNumToAdd(textLength) {
    return textLength < 300 ? 1 : 0;
}

function getRandomChange(text) {
    // Add some characters
    var numToAdd = getNumToAdd(text.length);
    var added = 0;
    while (added < numToAdd) {
        var prob = numToAdd - added;
        if (prob > 1 || Math.random() < prob) {
            // Add a character
            text += Math.random() < 0.167 ? ' ' : PostUtil.getRandomCharacter();
        }
        added += 1;
    }

    // Change some characters
    return text.split('').map(function (c) {
        if (c == ' ') return c;else if (Math.random() <= 0.2) {
            // Change every 10th character on average.
            return PostUtil.getRandomCharacter();
        }
        return c;
    }).join('');
}

function animateResult(result, deadline) {
    var missingMillis = deadline.getTime() - new Date().getTime();
    // Exit, if the deadline was reached
    if (missingMillis <= 0) {
        TEXT_OUTPUT.html(result);
        focusOnInput();
        return;
    }

    var newOutput = TEXT_OUTPUT.html();
    // Calculate the number of steps missing to the deadline
    var steps = Math.ceil(missingMillis / ANIMATE_INTERVAL_MILLIS);
    var missingChars = result.length - newOutput.length;
    if (missingChars > 0) {
        // Add some random characters at the end
        var numToAdd = Math.ceil(missingChars / steps);
        newOutput += PostUtil.getRandomSentence(numToAdd);
    } else if (missingChars < 0) {
        // Remove some characters
        var toRemove = Math.ceil(-missingChars / steps);
        newOutput = newOutput.substr(0, newOutput.length - toRemove);
    }

    // Switch some characters to the correct version
    // Get the wrong characters
    var wrongIndices = [];
    Array.from(newOutput).forEach(function (char, index) {
        if (index < result.length && char != result[index]) {
            wrongIndices.push(index);
        }
    });

    // Choose the characters to change
    var numToChange = Math.ceil(wrongIndices.length / steps);
    var changeIndices = _.sample(wrongIndices, numToChange);
    changeIndices.forEach(function (index) {
        // Replace the index
        newOutput = newOutput.substr(0, index) + result[index] + newOutput.substr(index + 1);
    });

    // Set the new output and schedule the next steps
    TEXT_OUTPUT.html(newOutput);
    setTimeout(function () {
        return animateResult(result, deadline);
    }, ANIMATE_INTERVAL_MILLIS);
}

function animateWaiting(requestId) {
    TEXT_OUTPUT.show();
    TEXT_BRIDGE.show();
    TEXT_OUTPUT.html('a');
    setTimeout(function () {
        return refreshAnimateWaiting(requestId);
    }, ANIMATE_INTERVAL_MILLIS);
}

function refreshAnimateWaiting(requestId) {
    if (pendingRequestId == requestId) {
        // Animate the text
        TEXT_OUTPUT.html(getRandomChange(TEXT_OUTPUT.html()));

        setTimeout(function () {
            return refreshAnimateWaiting(requestId);
        }, ANIMATE_INTERVAL_MILLIS);
    } else if (pendingRequestId == null) {
        // Display the result with an animation lasting one second
        var deadline = new Date(new Date().getTime() + 1000);
        animateResult(result, deadline);
    }
}

function focusOnInput() {
    if (!TEXT_INPUT.is(":focus")) PostUtil.placeCaretAtEnd(TEXT_INPUT.get(0));
}