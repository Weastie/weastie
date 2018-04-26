/* globals $ Quill */

let editor

$(document).ready(function () {
  $('#title').on('input', verifyTitle)

  editor = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Article body here...',
    modules: {
      toolbar: {
        container: [
          [{header: [1, 2, 3, false]}],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          ['image'],
          [{'indent': '-1'}, { 'indent': '+1' }],
          [{'list': 'ordered'}, { 'list': 'bullet' }]
        ],
        handlers: {
          image: imageHandler
        }
      },
      imageResize: {}
    }
  })
})

function imageHandler () {
  let iframe = $('<iframe src="/admin/image_upload" width="550px" height="400px">Iframe not supported by browser</iframe>')
  $('body').append(iframe)

  /* const range = editor.getSelection()
  const src = prompt('What is the image code?')
  const scale = prompt('What factor should the image be scaled by?\n1 = no scale, 0.5 = 50% size, 1.5 = 150% size, etc.')
  const newSrc = '/assets/img/upload/' + src
  if (src.length > 0 && scale.length > 0) {
    editor.pasteHTML(range.index, '<img src="' + newSrc + '" height="auto" width="' + (Number(scale) * 100) + '%">', Quill.sources.USER)
  } */
}

function addImages (list) {
  const trimBrackets = list.substring(1, list.length - 1)
  const removeQuotes = trimBrackets.replace(/"/g, '')
  const ids = removeQuotes.split(',')
  let range
  let src

  for (let i = 0; i < ids.length; i++) {
    range = editor.getSelection()
    src = '/assets/img/upload/' + ids[i]
    console.log(src)

    editor.pasteHTML(range.index, '<img src="' + src + '" height="auto" max-width="600px">', Quill.sources.USER)
  }
  removeIframes()
}

function removeIframes () {
  $('iframe').remove()
}

function verifyTitle () {
  var len = $('#title').val().length
  if (len >= 1 && len <= 150) {
    $('#titleerror').addClass('hidden')
    $('#title').removeClass('form-error')
    return true
  }
  $('#titleerror').removeClass('hidden')
  $('#title').addClass('form-error')
  return false
}

function verifyForm () {
  $('#content').val(editor.root.innerHTML)
  return verifyTitle()
}
