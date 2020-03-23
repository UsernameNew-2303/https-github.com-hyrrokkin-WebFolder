function load_folder_table() {
    logicInitialize();
    viewerInitialize();

    $.get('/create_folder_table')
    .done(function(JSON_folder_elements) {
        create_folder_elements(JSON.parse(JSON_folder_elements));
        paint_folder_table();
    }).fail(function() {
        alert("Что-то пошло не так");
    });
}


function reload_folder_table() {
    $.get('/recreate_folder_table')
    .done(function(JSON_folder_elements) {
        clear_selection();
        clear_sort();
        create_folder_elements(JSON.parse(JSON_folder_elements));
        repaint_folder_table();
    }).fail(function() {
        alert("Что-то пошло не так2");
    });
}


function clear_selection() {
    for (var i = selectedRows.length - 1; i >= 0 ; i--) {
        selectedRows.pop();
    }

    for (var i = 2; i < folderElementsTable.rows.length; i++) {
        folderElementsTable.rows[i].classList.remove("selected_dir_row");
    }
}


function sort_folder_table(direction) {
    current_sort_date = direction;

    switch (current_sort_direction) {
        case SortDirection.NONE: {
            current_sort_direction = SortDirection.UP;
            break;
        }

        case SortDirection.UP: {
            current_sort_direction = SortDirection.DOWN;
            break;
        }

        case SortDirection.DOWN: {
            current_sort_direction = SortDirection.UP;
            break;
        }

        default: {
            return;
        }
    }

    sort_folder_elements();

    repaint_folder_table();
    paint_sort_image();
}


function select_folder_table_row(tableRow) {
    var selected = false;
    var selected_index = -1;

     for (var i = 0; i < selectedRows.length; i++) {
        if (selectedRows[i] == folder_elements[tableRow.rowIndex - 2]) {
            selected = true;
            selected_index = i;

            break;
        }
    }

    if (selected) {
        selectedRows.splice(selected_index, 1);
        tableRow.classList.remove("selected_dir_row");
    } else {
        selectedRows.push(folder_elements[tableRow.rowIndex - 2]);
        tableRow.classList.add("selected_dir_row");
    }

    view_files_button();
}


function open_directory(tableRow) {
    var post_send;

    if (tableRow.rowIndex == 1) {
        post_send = 'back';
    } else {
        post_send = folder_elements[tableRow.rowIndex - 2]['path'];
    }

    $.post('/view_dir', {
        path_dir: post_send
    }).done(function(JSON_folder_elements) {
        clear_selection();
        clear_sort();
        close_create_folder_popup();
        hide_remove_button();
        remove_sort_image();

        create_folder_elements(JSON.parse(JSON_folder_elements));
        repaint_folder_table();
    }).fail(function() {
        alert("Что-то пошло не так");
    });
}


function download_files() {
    if (selectedRows.length == 1 && selectedRows[0]['type'] != 'dir') {
        var link = document.createElement("a");
        link.download = selectedRows[0]['path'];
        link.href = '/download/' + selectedRows[0]['path'];
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    } else {
        $.post('/get_full_path', {
            files: JSON.stringify(selectedRows)
        }).done(function(path_files) {
            var rest_req = JSON.parse(path_files);
            var link = document.createElement("a");

            link.download = rest_req['name'];
            link.href = '/download/' + rest_req['path'];
            document.body.appendChild(link)
            link.click();
            link.parentNode.removeChild(link);
        }).fail(function() {
            alert("Что-то пошло не так");
        });
    }

    clear_selection();
}


function upload_file() {
    var data = new FormData();
    data.append('files', $("#upload_files_button")[0].files[0])
    var form_data = new FormData($('#upload_file')[0]);
    alert(data);

    $.ajax({
        type: 'POST',
        url: '/upload',
        data: form_data,
        contentType: false,
        cache: false,
        processData: false,

        success: function(data) {
            console.log('Success!');
        },
    }).done(function(JSON_file) {
        push_folder_element(JSON.parse(JSON_file));

        repaint_folder_table();
        paint_sort_image();
    }).fail(function() {
        alert("Что-то пошло не так");
    });
}


function open_create_folder_popup() {
    if (createFolderPopup.style.display == "block") {
        createFolderPopup.style.display = "none";
        openedCreateFolderPopup = false;
        createFolderButton.disabled = false;
    } else {
        folderNameInput.value = "";
        createFolderPopup.style.display = "block";
        createFolderButton.disabled = false;

        //folderElementsTable.rows[3].addClass("disabled");
        folderElementsTable.rows[3].disabled = true;
        alert('s');
        $("tr").addClass("disabled");
    }
}


function close_create_folder_popup() {
    createFolderPopup.style.display = "none";
    openedCreateFolderPopup = false;
    createFolderButton.disabled = false;
}


function create_folder() {
    $.post('/create_folder', {
        folder_name: folderNameInput.value
    }).done(function(JSON_folder_element) {
        clear_selection();
        clear_sort();
        remove_sort_image();

        unshift_folder_element(JSON.parse(JSON_folder_element));

        repaint_folder_table();
        close_create_folder_popup();
    }).fail(function() {
        alert("Что-то пошло не так");
    });
}


function view_files_button() {
    if (selectedRows.length == 0) {
        removeButton.classList.add("hidden");
        cutButton.classList.add("hidden");
        copyButton.classList.add("hidden");
    } else {
        removeButton.classList.remove("hidden");
        cutButton.classList.remove("hidden");
        copyButton.classList.remove("hidden");
    }
}


function hide_remove_button() {
    removeButton.classList.add("hidden");
}


function remove() {
    $.post('/remove', {
        files: JSON.stringify(selectedRows)
    }).done(function(path_files) {
        remove_elements_from_array(folder_elements, selectedRows);
        clear_selection();
        repaint_folder_table();
    }).fail(function() {
        alert("Что-то пошло не так");
    });
}


function check_name(text_input) {
    $.post('/is_exist_folder', {
        folder_name: JSON.stringify(text_input.value)
    }).done(function(JSON_response) {
        //alert(JSON.parse(JSON_response));
        if (JSON.parse(JSON_response)){
            createFolderButton.disabled = true;
        } else {
            createFolderButton.disabled = false;
        }
    }).fail(function() {
        alert("Что-то пошло не так");
    });
}


function copy() {
    currentLocationChangeType = LocationChangeType.COPY;

    folderElementsBuffer = clone_array(selectedRows);

    pasteButton.classList.remove("hidden");
}


function cut() {
    currentLocationChangeType = LocationChangeType.MOVE;

    folderElementsBuffer = clone_array(selectedRows);

    pasteButton.classList.remove("hidden");
}

function paste() {
    $.post('/change_location', {
        folder_elements: JSON.stringify(folderElementsBuffer),
        location_change_type: JSON.stringify(currentLocationChangeType)
    }).done(function() {
        reload_folder_table();
    }).fail(function() {
        alert("Что-то пошло не так");
    });
}