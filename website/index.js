const apiUrl =  window.location.hash === '#node' ? 'http://localhost:3000' : 'http://localhost:5070';


window.addEventListener('load', () => {

    console.log('loaded');

    loadMedias();

    $('#mediaFile').on('change', handleUpload);
});

async function loadMedias() {

    let response = null;

    try {
        response = await fetch(apiUrl + '/media');
        if (response.status !== 200) {
            $('.app-list').html(`<div class="alert alert-danger">Falha ao baixar lista de midias</div>`);
            return;
        }
    }
    catch(error) {
        $('.app-list').html(`<div class="alert alert-danger">Falha ao baixar lista de midias</div>`);
        return;
    }

    const data = await response.json();

    const $listItem = $('<div class="list-group"></div>');

    for (const item of data) {

        const description = [ item.title, item.artist ?? '', item.album ?? '' ].join(' - ');

        const $item = $(`
            <div class="list-group-item list-group-item-action">
                <div class="d-flex">
                    <div class="flex-shrink-0">
                        ${item.thumbnailLink ? `<img height="50" src="${apiUrl + '/' + item.thumbnailLink}">` : getImageSvg()}
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <h5 class="mt-0">${item.name}</h5>
                        ${description}
                    </div>
                </div>
            </div>`);
        $item.on('click', handleItemClick.bind(null, item));

        $listItem.append($item);
    }

    $('.app-list').empty().append($listItem);
}

function getImageSvg() {

    return `<svg class="bd-placeholder-img" width="50" height="50" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Placeholder: Image" preserveAspectRatio="xMidYMid slice" focusable="false"><title>Placeholder</title><rect width="100%" height="100%" fill="#e5e5e5"></rect><text x="50%" y="50%" fill="#999" dy=".3em">Image</text></svg>`;
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

    let response = null;

    try {
        response = await fetch(apiUrl + '/media/upload', {
            method: 'POST',
            body: formData
        });
    }
    catch(error) {
        alert('Falha ao enviar arquivo');
        return;
    }

    if (response.status !== 200) {
        alert('Falha ao enviar arquivos');
        return;
    }

    loadMedias();
}
