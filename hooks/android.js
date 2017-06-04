var filesystem = require('fs');
var path = require('path');

/**
 * Gets the index of a line of text containing a specific value.
 * @param {string} content
 * @param {string} value
 * @returns {number}
 */
function getLineIndex (content, value) {
  var lines = content.toString().split('\n');

  for (var i = 0, length = lines.length; i < length; i++) {
    if (lines[i].indexOf(value) === -1) {
      continue;
    }

    return i;
  }

  return -1;
}

/**
 * Inserts a line of text at a specific index location.
 * @param {string} content
 * @param {number} index
 * @param {string} value
 * @returns {string}
 */
function insertLineAt (content, index, value) {
  var lines = content.toString().split('\n');

  lines.splice(index, 0, value);

  return lines.join('\n');
}

module.exports = function (context) {
  var cordovaDirectory = path.resolve(context.opts.projectRoot);
  var buildGradleSource = path.resolve(cordovaDirectory, './platforms/android/build.gradle');
  var googleServicesSource1 = path.resolve(cordovaDirectory, './google-services.json');
  var googleServicesSource2 = path.resolve(cordovaDirectory, '../', './google-services.json');
  var googleServicesTarget = path.resolve(cordovaDirectory, './platforms/android/google-services.json');

  // copy google-services to root src directory
  if (filesystem.existsSync(googleServicesSource1)) {
    filesystem.writeFileSync(googleServicesTarget, filesystem.readFileSync(googleServicesSource1));
  } else if (filesystem.existsSync(googleServicesSource2)) {
    filesystem.writeFileSync(googleServicesTarget, filesystem.readFileSync(googleServicesSource2));
  } else {
    filesystem.writeFileSync(googleServicesTarget, '{}');
  }

  // insert dependencies into gradle buildscript
  if (filesystem.existsSync(buildGradleSource)) {
    var buildGradeFile = filesystem.readFileSync(buildGradleSource);
    var index =  getLineIndex(buildGradeFile, 'com.android.tools.build:gradle');
    var content = insertLineAt(buildGradeFile, index + 1, "\t\t\t\tclasspath 'com.google.gms:google-services:3.1.0'");

    // insert google-services as buildscript dependency
    if (getLineIndex(buildGradeFile, 'com.google.gms:google-services:3.0.0') === -1) {
      filesystem.writeFileSync(buildGradleSource, content);
    }

    // apply google-services at bottom of file
    if (getLineIndex(buildGradeFile, "apply plugin: 'com.google.gms.google-services'") === -1) {
      filesystem.appendFileSync(buildGradleSource, "\napply plugin: 'com.google.gms.google-services'");
    }
  }
};
