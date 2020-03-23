var pageContent;
var controlBox;
var folderElementsTable;
var folderElementsTableHeader;
var nameCellHeader;
var typeCellHeader;
var sizeCellHeader;
var lastModificationCellHeader;
var sortImage;
var uploadButton;
var removeButton;
var pasteButton;
var cutButton;
var copyButton;
var createFolderPopup;
var folderNameInput;
var createFolderButton;


function viewerInitialize() {
    folderElementsTable             = document.getElementById("folder_table");
    pageContent                     = document.getElementById("page_content");
    controlBox                      = document.getElementById("control_box");
    folderElementsTable             = document.getElementById("folder_table");
    folderElementsTableHeader       = document.getElementById("folder_elements_table_header");
    nameCellHeader                  = document.getElementById("name_cell");
    typeCellHeader                  = document.getElementById("type_cell");
    sizeCellHeader                  = document.getElementById("size_cell");
    lastModificationCellHeader      = document.getElementById("last_modification_cell");
    uploadButton                    = document.getElementById("upload_file_btn");
    removeButton                    = document.getElementById("remove_button");
    cutButton                       = document.getElementById("cut_button");
    copyButton                      = document.getElementById("copy_button");
    pasteButton                     = document.getElementById("paste_button");
    createFolderPopup               = document.getElementById("create_folder_popup");
    folderNameInput                 = document.getElementById("folder_name_input");
    createFolderButton              = document.getElementById("create_folder_button");

    createFolderPopup.style.display = "none";
}


function paint_folder_table_row(index, row) {
    var rowItem                     = folderElementsTable.insertRow();

    var nameCell                    = rowItem.insertCell(0);
    var typeCell                    = rowItem.insertCell(1);
    var sizeCell                    = rowItem.insertCell(2);
    var lastModificationCell        = rowItem.insertCell(3);

    var image                       = document.createElement("img");

    rowItem.setAttribute("class", "dir_item");
    rowItem.setAttribute("onclick", "table_row_select(this)");

    if (row['type'] == 'dir') {
        image.setAttribute("src", "/static/images/dir_icon.png");
        image.setAttribute("class", "dir_item_icon");

        nameCell.appendChild(image);
        nameCell.innerHTML = nameCell.innerHTML + row['name'];

        typeCell.innerHTML = 'Папка с файлами';
        sizeCell.innerHTML = '-';

        rowItem.setAttribute("ondblclick", "open_directory(this)");
    } else {
        image.setAttribute("src", "/static/images/file_icon2.png");
        image.setAttribute("class", "file_item_icon");

        nameCell.appendChild(image);
        nameCell.innerHTML = nameCell.innerHTML + row['name'];

        if (row['type'] == 'file') {
            typeCell.innerHTML = 'Файл';
        } else {
            typeCell.innerHTML = row['type'];
        }

        sizeCell.innerHTML = row['size'] + ' КБайт';
    }

    sizeCell.setAttribute("align", "right");

    lastModificationCell.innerHTML = row['date_modification'].toLocaleString("ru").replace(',', '');

    rowItem.setAttribute("onclick", "select_folder_table_row(this)");

     /*onclick="table_row_select(this)" ondblclick="open_directory(this)"*/
}


function paint_folder_table() {
    for (var i = 0; i < folder_elements.length; i++) {
        paint_folder_table_row(i, folder_elements[i]);
    }
}


function clear_folder_table() {
    for (var i = folderElementsTable.rows.length - 1; i > 1; i--) {
        folderElementsTable.deleteRow(i);
    }
}


function repaint_folder_table() {
    clear_folder_table();
    paint_folder_table();
}


function remove_sort_image() {
    if (sortImage != null) {
        sortImage.parentNode.removeChild(sortImage);
    }
}


function paint_sort_image() {
    sortImage = document.getElementById("sort_image_id");

    remove_sort_image();

    sortImage = document.createElement("img");

    switch (current_sort_direction) {
        case SortDirection.NONE: {
            return;
        }

        case SortDirection.UP: {
            sortImage.setAttribute("src", "static/images/sort_up.png");
            sortImage.setAttribute("id", "sort_img_id");
            //sortImage.setAttribute("class", "sort_icon");
            sortImage.setAttribute("style", "width: 14px; height: 8px; margin-left: 10px;");
            //sortImage.setAttribute("src", "{{ url_for('.static', filename='images/sort_up.png') }}");
            break;
        }

        case SortDirection.DOWN: {
            sortImage.setAttribute("src", "static/images/sort_down.png");
            sortImage.setAttribute("id", "sort_img_id");
            //sortImage.setAttribute("class", "sort_icon");
            sortImage.setAttribute("style", "width: 14px; height: 8px; margin-left: 10px;");
            //sortImage.setAttribute("src", "{{ url_for('.static', filename='images/sort_down.png') }}");
            break;
        }

        default: {
            return;
        }
    }

    sortImage.setAttribute("id", "sort_image_id");
    sortImage.setAttribute("class", "sort_image_class");

    switch (current_sort_date) {
        case SortData.NONE: {
            return;
        }

        case SortData.NAME: {
            nameCellHeader.appendChild(sortImage);
            break;
        }

        case SortData.TYPE: {
            typeCellHeader.appendChild(sortImage);
            break;
        }

        case SortData.SIZE: {
            sizeCellHeader.appendChild(sortImage);
            break;
        }

        case SortData.DATE_MODIFICATION: {
            lastModificationCellHeader.appendChild(sortImage);
            break;
        }
    }
}