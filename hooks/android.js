const filesystem = require('fs');
const path = require('path');

/**
 * Gets the number count of lines of text
 * @param {string} content
 * @returns {number}
 */
function getLineCount (content) {
  return content.toString().split('\n').length;
}

/**
 * Gets the index of a line of text containing a specific value.
 * @param {string} content
 * @param {string} value
 * @returns {number}
 */
function getLineIndex (content, value) {
  const lines = content.toString().split('\n');

  for (let i = 0, length = lines.length; i < length; i++) {
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
  const lines = content.toString().split('\n');

  lines.splice(index, 0, value);

  return lines.join('\n');
}

module.exports = function (context) {
  const cordovaDirectory = path.resolve(context.opts.projectRoot);
  const buildGradleSource = path.resolve(cordovaDirectory, './platforms/android/build.gradle');
  const googleServicesSource1 = path.resolve(cordovaDirectory, './google-services.json');
  const googleServicesSource2 = path.resolve(cordovaDirectory, '../', './google-services.json');
  const googleServicesTarget = path.resolve(cordovaDirectory, './platforms/android/google-services.json');

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
    let content = filesystem.readFileSync(buildGradleSource);

    // insert google services as buildscript dependency
    if (getLineIndex(content, 'com.google.gms:google-services:3.1.0') === -1) {
      content = insertLineAt(content,
        getLineIndex(content, 'com.android.tools.build') + 1,
        "\t\t\t\tclasspath 'com.google.gms:google-services:3.1.0'"
      );
    }

    // insert google maven as allproject repository
    if (getLineIndex(content, 'https://maven.google.com') === -1) {
      content = insertLineAt(content,
        getLineIndex(content, 'allprojects') + 4,
        "\t\t\t\tmaven { url 'https://maven.google.com' }"
      );
    }

    // apply google services at bottom of file
    if (getLineIndex(content, "apply plugin: 'com.google.gms.google-services'") === -1) {
      content = insertLineAt(content,
        getLineCount(content) - 1,
        "\napply plugin: 'com.google.gms.google-services'"
      );
    }

    // write changes to gradle file
    filesystem.writeFileSync(buildGradleSource, content);
  }
};
