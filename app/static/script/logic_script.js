var SortData = Object.freeze({
    "NONE":               0,
    "NAME":               1,
    "TYPE":               2,
    "SIZE":               3,
    "DATE_MODIFICATION":  4
});

var SortDirection = Object.freeze({
    "NONE":               0,
    "UP":                 1,
    "DOWN":              -1
});

var LocationChangeType = Object.freeze({
    "NONE":               'none',
    "COPY":               'copy',
    "MOVE":               'move'
});

var folder_elements;
var selectedRows;
var current_sort_date;
var current_sort_direction;
var openedCreateFolderPopup;
var folderElementsBuffer;
var currentLocationChangeType;


function clone_array(array) {
    var new_array = [];

    for (var i = 0; i < array.length; i++) {
        new_array.push(array[i]);
    }

    return new_array;
}


function clear_sort() {
    current_sort_date           = SortData.NONE;
    current_sort_direction      = SortDirection.NONE;
}


function logicInitialize() {
    selectedRows                = [];
    current_sort_date           = SortData.NONE;
    current_sort_direction      = SortDirection.NONE;
    openedCreateFolderPopup     = false;
    folderElementsBuffer        = [];
    currentLocationChangeType   = LocationChangeType.NONE;
}


function clear_folder_elements() {
    for (var i = folder_elements.length - 1; i > 0; i--) {
        folder_elements.deleteRow(i);
    }
}


function swap(array, i, j) {
    var transposition = array[i];

    array[i] = array[j];
    array[j] = transposition;
}


function remove_elements_from_array(array, elements) {
    for (var i = 0; i < elements.length; i++) {
        for (var j = 0; j < array.length; j++) {
            if (array[j] == elements[i]) {
                array.splice(j, 1);
                j--;
            }
        }
    }
}


function insert_folder_element(index, name, type, size, dateModification, path) {
    push_folder_element(name, type, size, dateModification, path);

    swap(folder_elements, index, folder_elements.length - 1);
}

function insert_folder_element(index, folder_element_str) {
    push_folder_element(folder_element_str);

    swap(folder_elements, index, folder_elements.length - 1);
}

function create_folder_element_dict(folder_element_str) {
    var folder_element = {};

    folder_element['name'] = folder_element_str['name'];
    folder_element['type'] = folder_element_str['type'];

    if (folder_element['type'] == 'dir') {
        folder_element['size'] = -1;
    } else {
        folder_element['size'] = parseInt(folder_element_str['size']);
    }

    folder_element['date_modification'] = new Date(folder_element_str['last_modified']);
    folder_element['path'] = folder_element_str['path'];

    return folder_element;
}

function unshift_folder_element(folder_element_str) {
    folder_elements.unshift(create_folder_element_dict(folder_element_str));
}


function push_folder_element(folder_element_str) {
    /*var folder_element = {};

    folder_element['name'] = folder_element_str['name'];
    folder_element['type'] = folder_element_str['type'];

    if (folder_element['type'] == 'dir') {
        folder_element['size'] = -1;
    } else {
        folder_element['size'] = parseInt(folder_element_str['size']);
    }

    folder_element['date_modification'] = new Date(folder_element_str['last_modified']);
    folder_element['path'] = folder_element_str['path'];*/

    folder_elements.push(create_folder_element_dict(folder_element_str));
}


function create_folder_elements(folder_elements_dict) {
    folder_elements = [];

    for (var i = 0; i < folder_elements_dict.length; i++) {
        push_folder_element(folder_elements_dict[i]);
    }
}


function swaped_table_element(i, j) {
    switch (current_sort_date) {
        case SortData.NONE: {
            return false;
        }

        case SortData.NAME: {
            switch (current_sort_direction) {
                case SortDirection.NONE: {
                    return false;
                }

                case SortDirection.UP: {
                    return folder_elements[i]['name'].toUpperCase() > folder_elements[j]['name'].toUpperCase();
                }

                case SortDirection.DOWN: {
                    return folder_elements[i]['name'].toUpperCase() < folder_elements[j]['name'].toUpperCase();
                }

                default: {
                    return false;
                }
            }
        }

        case SortData.TYPE: {
            switch (current_sort_direction) {
                case SortDirection.NONE: {
                    return false;
                }

                case SortDirection.UP: {
                    return folder_elements[i]['type'].toUpperCase() > folder_elements[j]['type'].toUpperCase();
                }

                case SortDirection.DOWN: {
                    return folder_elements[i]['type'].toUpperCase() < folder_elements[j]['type'].toUpperCase();
                }

                default: {
                    return false;
                }
            }
        }

        case SortData.SIZE: {
            switch (current_sort_direction) {
                case SortDirection.NONE: {
                    return false;
                }

                case SortDirection.UP: {
                    return folder_elements[i]['size'] > folder_elements[j]['size'];
                }

                case SortDirection.DOWN: {
                    return folder_elements[i]['size'] < folder_elements[j]['size'];
                }

                default: {
                    return false;
                }
            }
        }

        case SortData.DATE_MODIFICATION: {
            switch (current_sort_direction) {
                case SortDirection.NONE: {
                    return false;
                }

                case SortDirection.UP: {
                    return folder_elements[i]['date_modification'] > folder_elements[j]['date_modification'];
                }

                case SortDirection.DOWN: {
                    return folder_elements[i]['date_modification'] < folder_elements[j]['date_modification'];
                }

                default: {
                    return false;
                }
            }
        }
    }
}


function sort_folder_elements() {
    for (var _out = folder_elements.length - 1; _out > 0; _out--) {
        for (var _in = 0; _in < _out; _in++) {
            if (swaped_table_element(_in, _in + 1)) {
                swap(folder_elements, _in, _in + 1);
            }
        }
    }


    /*var i               = 0;
    var swap_count      = 0;*/

    /*if (folder_elements.length == 0) {
        return;
    }

    while (i < folder_elements.length) {
        if (((i + 1) != folder_elements.length) && swaped_table_element(i, i + 1)) {
    	    swap(folder_elements, i, i + 1);
			swap_count = 1;
		}

		i++;

		if ((i == folder_elements.length) && (swap_count == 1)) {
            swap_count    = 0;
            i             = 0;
		}
    }*/
}
