'use strict';

processPageElements();

function processPageElements() {
    // Wrap each chart with siblings in a div to be able to safely clear the chart.js iframe
    // junk
    $('canvas.chart').filter(function (index, element) {
        return $(element).siblings();
    }).wrap('<div></div>');

    // Apply the transforms
    colorCellsByLogValue();

    runHighlighting();
}

function colorCellsByLogValue() {
    $('[data-transform="color-cells-by-log-value"]').each(function (index, element) {
        var cells = $(element).find('td');

        // Determine the min and max log values
        var min = null;
        var max = null;
        cells.each(function (index, cell) {
            cell = $(cell);
            var val = parseFloat(cell.html());
            if (!isNaN(val)) {
                val = Math.log(val);
                min = min ? Math.min(min, val) : val;
                max = max ? Math.max(max, val) : val;
            }
        });

        // Color each cell based on its value
        cells.each(function (index, cell) {
            cell = $(cell);
            var val = parseFloat(cell.html());
            if (!isNaN(val)) {
                val = Math.log(val);
                var percentage = (val - min) / (max - min);
                cell.css('background-color', 'rgba(229,115,115,' + percentage + ')');
            }
        });
    });
}

function runHighlighting() {
    // MathJax.Hub.Queue(["Typeset", MathJax.Hub]); // Run Mathjax

    // Run hljs
    $('pre code').each(function (i, block) {
        hljs.highlightBlock(block);
    });
}