/* global $ */

$(document).ready(function () {
  $('#cancel').click(function (e) {
    window.top.removeIframes()
  })
  $('#imageUpload').on('change', function (e) {
    console.log(e.currentTarget.files.length)
    let descText = e.currentTarget.files.length + ' image(s) ready to submit:'
    for (let i = 0; i < e.currentTarget.files.length; i++) {
      descText += '<br>- ' + e.currentTarget.files[i].name
    }
    $('#imageDesc').html(descText)
  })
})

function check() {
  if ($('#imageUpload')[0].files.length > 0) {
    return true
  } else {
    $('#imageDesc').html('You have not selected any files!')
    return false
  }
}
