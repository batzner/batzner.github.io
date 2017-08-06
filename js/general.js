'use strict';

$(function () {
    // Wrap tables to make them responsive.
    $('table').filter(function (index, element) {
        return !$(element).parent().hasClass('table-container');
    }).wrap('<div class="table-container"></div>');

    // Bring the bootstrap dropdowns to life
    $('.dropdown-menu li a').off('click').click(function () {
        selectDropdownItem($(this));
    });

    // Activate the show more toggles
    $('.show-more').off('click').click(function ($event) {
        // Expand / hide additional information
        var button = $($event.target);
        var target = $('#' + button.data('target-id'));
        var showText = button.data('show-text') || 'Show more';
        var hideText = button.data('hide-text') || 'Show less';
        // If the target is visible, it won't be after this block.
        button.html(target.is(':visible') ? showText : hideText);
        target.slideToggle();
    });
});

function selectDropdownItem(elem) {
    var triggerOnChange = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    var buttonElem = elem.closest('.btn-group').find('button').first();
    var choiceElem = buttonElem.find('.choice');
    // Set the text on the span
    choiceElem.html(elem.text());
    // Set the selected value on the button
    buttonElem.val(elem.data('value'));
    if (triggerOnChange) {
        buttonElem.change();
    }
}