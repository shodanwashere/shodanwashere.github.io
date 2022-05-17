/**
 * Code that executes when a click happens inside the grid.
 *
 * @param interaction An object that describes the user interaction that just
 * occurred. It contains the following fields:
 * - x: The X coordinate of the click
 * - y: The Y coordinate of the click
 * - target: The DOM node that received the click.
 * - class: This string is either 'goal-0' if the user clicked the current
 *          target, 'goal-1' if they clicked the next target, 'goal-2' if they
 *          clicked the one following that, or else the empty string
 * - distance: The distance between the click and the center of the current
 *   target
 * - elapsed: The time elapsed since the previous click
 * - type: The type of click, either 'success', 'failure' or 'mistake'
 *
 * Notice that the X and Y coordinates are with regard to the grid. Thus, (0, 0)
 * is the top left corner of the grid.
 */
function processClick(interaction) {
    var audio;
    if(interaction.type === "success")
        audio = new Audio('ding.mp3');
    if(interaction.type === "failure")
        audio = new Audio('error.mp3');
    audio.play();
    delete audio;
}

/**
 * Code that executes when the sequence ends (the user has clicked he last
 * target)
 *
 * @param performance An object that describes the performance of the user. It
 * contains the following fields:
 * - age: The age of the user, which was given by them at the start of the
 *   exercise
 * - elapsed: The total time since the user was shown the first target
 * - successes: The number of successful clicks
 * - failures: The number of failed clicks (on wrong targets)
 * - mistakes: The number of clicks inside the grid but outside any target
 * - interactions: An array with the interactions made by the user.
 *
 * For a description of an interaction, see the documentation of the
 * `processClick` function
 */
function processEnd(performance) {
    //
}

document.addEventListener('DOMContentLoaded', () => {
    // Code here executes after the page finishes loading.
});
