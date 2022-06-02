const apiUrl =  window.location.hash === '#node' ? 'http://localhost:3000' : 'http://localhost:5070';


window.addEventListener('load', () => {

    console.log('loaded');

    loadMedias();

    $('#mediaFile').on('change', handleUpload);
});

async function loadMedias() {

    const response = await fetch(apiUrl + '/media');
    if (response.status !== 200) {
        $('.app-list').html(`<div class="alert alert-danger">Falha ao baixar lista de midias</div>`);
        return;
    }

    const data = await response.json();

    const $listItem = $('<div class="list-group"></div>');

    for (const item of data) {

        const $item = $(`<div class="list-group-item list-group-item-action">${item.name}</div>`);
        $item.on('click', handleItemClick.bind(null, item));

        $listItem.append($item);
    }

    $('.app-list').empty().append($listItem);
}

function handleItemClick(media) {

    if (media.type === 'audio') {

        $('.app-player').empty().html(`
            <audio autoplay="autoplay" controls="controls">
                    <source id="test" src="${apiUrl + '/' + media.link}">
            </audio>
        `);
    }
    else if (media.type === 'video') {

        $('.app-player').empty().html(`
            <video autoplay="autoplay" controls="controls">
                    <source id="test" src="${apiUrl + '/' + media.link}">
            </video>
        `);
    }
    else
        alert('Midia não suportada');
}

async function handleUpload(event) {

    const files = event.target.files;

    if (files.length === 0)
        return;

    const formData = new FormData();
    for (const file of files)
        formData.append('files', file);

    const response = await fetch(apiUrl + '/media/upload', {
        method: 'POST',
        body: formData
    });

    if (response.status !== 200) {
        alert('Falha ao enviar arquivos');
        return;
    }

    loadMedias();
}