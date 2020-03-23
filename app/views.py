import os
import sys
import json
import math
import datetime
import zipfile
import tempfile
import shutil

from distutils.dir_util import copy_tree
from stat import *

from flask import request, redirect, url_for, render_template, abort, send_file
from werkzeug.utils import secure_filename

from app import app
from app.forms import LoginForm


from flask_bootstrap import Bootstrap

bootstrap = Bootstrap(app)

configuration = {
    'start_folder': 'C:/',
    'current_folder': 'C:/'
}

zip_property = {
    'max_elements': 0,
    'current_elements': 0
}

ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'])

#app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

class FolderElement():
    def __init__(self, path, name, type, size, last_modified):
        self.path             = path
        self.name             = name
        self.type             = type
        self.size             = size
        self.last_modified    = last_modified


class FolderElementEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, FolderElement):
            return obj.__dict__
        return json.JSONEncoder.default(self, obj)


def create_folder_list(path):
    folder_list = list()

    try:
        lst = os.listdir(path)
    except OSError:
        pass
    else:
        for file_name in lst:
            full_path                       = os.path.join(path, file_name)
            statinfo                        = os.stat(full_path)

            file_size                       = statinfo.st_size
            file_last_modified              = datetime.datetime.fromtimestamp(statinfo.st_mtime).isoformat()
            #strftime("%d.%m.%Y %H:%M")

            if not S_ISDIR(statinfo.st_mode) == 0:
                file_type                   = "dir"
            else:

                if '.' in file_name:
                    file_type = os.path.splitext(file_name)[1][1:]

                    while file_name[len(file_name) - 1] != '.':
                        file_name = file_name[:len(file_name) - 1]

                    file_name = file_name[:len(file_name) - 1]
                else:
                    file_type               = "file"

            folder_element = dict()

            folder_element['path']          = full_path
            folder_element['name']          = file_name
            folder_element['type']          = file_type
            folder_element['size']          = math.ceil(file_size / 8)
            folder_element['last_modified'] = file_last_modified

            folder_list.append(folder_element)

    return folder_list


@app.route('/')
@app.route('/index')
def index():
    configuration['current_folder'] = configuration['start_folder']
    path = os.path.expanduser(configuration['start_folder'])

    form = LoginForm()

    return render_template('index.html',
                            title='Sign In',
                            form=form,
                            folder_list=create_folder_list(path))


@app.route('/create_folder_table', methods=['GET'])
def create_folder_table():
    return json.dumps(create_folder_list(configuration['start_folder']))


@app.route('/recreate_folder_table', methods=['GET'])
def recreate_folder_table():
    return json.dumps(create_folder_list(configuration['current_folder']))


@app.route('/view_dir', methods=['POST'])
def open_folder():
    new_dir = request.form['path_dir']

    if new_dir == 'back':
        if configuration['current_folder'] == configuration['start_folder']:
            pass
        else:
            configuration['current_folder'] = configuration['current_folder'][:len(configuration['current_folder']) - 1]

            while configuration['current_folder'][len(configuration['current_folder']) - 1] != '/':
                configuration['current_folder'] = configuration['current_folder'][:len(configuration['current_folder']) - 1]
    else:
        configuration['current_folder'] = new_dir

    return json.dumps(create_folder_list(configuration['current_folder']))


def zipfolder(target_dir, zipobj):
    #zipobj = zipfile.ZipFile(foldername + '.zip', 'w', zipfile.ZIP_DEFLATED)
    rootlen = len(target_dir) + 1
    for base, dirs, files in os.walk(target_dir):
        for file in files:
            fn = os.path.join(base, file)
            print(fn)
            tmp = target_dir.split('/')
            #print(tmp[len(tmp) - 1])

            zipobj.write(fn, tmp[len(tmp) - 1] + '/' + fn[rootlen:], zipfile.ZIP_DEFLATED)


def add_dir_to_zip(dir_name, zipf):
    print(configuration['current_folder'] + dir_name)
    lst = os.listdir(configuration['current_folder'] + dir_name)

    for file_name in lst:
        print(file_name)
        statinfo = os.stat(configuration['current_folder'] + dir_name + '/' + file_name)
        if not S_ISDIR(statinfo.st_mode) == 0:
            add_dir_to_zip(dir_name + "/" + file_name, zipf)
        else:
            zipf.write(file_name, dir_name + "\\test.py", zipfile.ZIP_DEFLATED)


def folder_elements_count(target_dir):
    rootlen = len(target_dir) + 1

    for base, dirs, files in os.walk(target_dir):
        for file in files:
            zip_property['max_elements'] += 1


@app.route('/get_status_write_zip', methods=['POST'])
def get_status_write_zip():
    return json.dumps(zip_property['current_elements'] / zip_property['max_elements'])


@app.route('/get_max_element_for_zip', methods=['POST'])
def get_max_element_for_zip():
    files = json.loads(request.form['files'])

    zip_property['max_elements'] = 0
    zip_property['current_elements'] = 0

    if len(files) > 1 or files[0]['type'] == 'Папка с файлами':
        full_name = datetime.datetime.now().strftime("%Y.%m.%d.%H.%M") + ".zip"
        path = str(tempfile.gettempdir()) + "/" + full_name

        for file in files:
            if file['type'] == 'Папка с файлами':
                folder_elements_count(configuration['current_folder'] + file['name'])
            else:
                zip_property['max_elements'] += 1
    else:
        zip_property['max_elements'] += 1

    return json.dumps(zip_property['max_elements'])


@app.route('/get_full_path', methods=['POST'])
def get_full_path():
    files = json.loads(request.form['files'])

    if len(files) > 1 or files[0]['type'] == 'dir':
        full_name = datetime.datetime.now().strftime("%Y.%m.%d.%H.%M") + ".zip"
        path = str(tempfile.gettempdir()) + "\\" + full_name

        zipf = zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED)

        for file in files:
            if file['type'] == 'dir':
                print(configuration['current_folder'] + file['name'])
                zipfolder(file['path'], zipf)
                #add_dir_to_zip(file['name'], zipf)
            else:
                zipf.write(file['path'])
                zipf.printdir()

        zipf.close()
    else:
        full_name = files[0]['name'] + '.' + files[0]['type']
        path = files[0]['path']

    sending = {
        'name': full_name,
        'path': path
    }

    print(path)

    #return send_file(configuration['current_folder'] + files[0]['name'] + '.' + files[0]['type'])
    return json.dumps(sending)


@app.route("/download/<path:path>")
def download_file(path):
    return send_file(path)


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_file(file):
    filename = file.filename
    index = 1
    path = configuration['current_folder'] + filename

    while os.path.exists(path):
        filename = file.filename.split('.')[0] + ' (' + str(index) + ').' + file.filename.split('.')[-1]
        path = configuration['current_folder'] + filename
        index += 1

    file.save(path)

    return filename, path


@app.route('/upload', methods = ['GET', 'POST'])
def upload_files():
    if request.method == 'POST':
        file = request.files['files']

        if file and allowed_file(file.filename):
            filename, path = upload_file(file)

            statinfo = os.stat(path)

            folder_element = dict()

            folder_element['path'] = path
            folder_element['name'] = filename
            folder_element['type'] = file.filename.split('.')[-1]
            folder_element['size'] = math.ceil(statinfo.st_size / 8)
            folder_element['last_modified'] = datetime.datetime.fromtimestamp(statinfo.st_mtime).isoformat()

            return json.dumps(folder_element)

@app.route('/create_folder', methods=['POST'])
def create_folder():
    folder_name = request.form['folder_name']
    index = 1
    path = configuration['current_folder'] + folder_name

    while os.path.exists(path):
        filename = folder_name + ' (' + str(index) + ')'
        path = configuration['current_folder'] + folder_name
        index += 1

    os.mkdir(path)

    statinfo = os.stat(path)

    folder_element = dict()

    folder_element['path'] = path
    folder_element['name'] = folder_name
    folder_element['type'] = 'dir'
    folder_element['size'] = -1
    folder_element['last_modified'] = datetime.datetime.fromtimestamp(statinfo.st_mtime).isoformat()

    return json.dumps(folder_element)


@app.route('/remove', methods=['POST'])
def remove():
    files = json.loads(request.form['files'])

    print('remove')

    for file in files:
        if file['type'] == 'dir':
            shutil.rmtree(file['path'], ignore_errors=True)
        else:
            os.remove(file['path'])

    return json.dumps(True)

@app.route('/is_exist_folder', methods=['POST'])
def is_exist_folder():
    folder_name = json.loads(request.form['folder_name'])

    try:
        lst = os.listdir(configuration['current_folder'])
    except OSError:
        pass
    else:
        for file_name in lst:
            full_path = os.path.join(configuration['current_folder'], file_name)
            statinfo = os.stat(full_path)

            print(file_name)
            print(folder_name)

            if not S_ISDIR(statinfo.st_mode) == 0 and file_name == folder_name:
                return json.dumps(True)

    return json.dumps(False)


@app.route('/change_location', methods=['POST'])
def change_location():
    files = json.loads(request.form['folder_elements'])
    location_change_type = json.loads(request.form['location_change_type'])

    for file in files:
        if location_change_type == 'move':
            shutil.move(file['path'], configuration['current_folder'])
        elif location_change_type == 'copy':
            if file['type'] == 'dir':
                print(file['path'])
                print(configuration['current_folder'])
                copy_tree(file['path'], configuration['current_folder'])
            else:
                shutil.copy2(file['path'], configuration['current_folder'])

    return json.dumps(True)

"""
@app.route("/<path:path>", methods=['POST', 'GET'])
def dir_viewer(path):
    content = list()

    try:
        lst = os.listdir(path)
    except OSError:
        pass
    else:
        for name in lst:
            fn = os.path.join(path, name)
            content.append(fn)
            print(content)

    form = LoginForm()

    return render_template('index.html',
                           title='Sign In',
                            form=form,
                            content=make_dir_content(path))

"""


def make_dir_content(path):
    content = list()

    try:
        lst = os.listdir(path)
    except OSError:
        pass
    else:
        for name in lst:
            fn = os.path.join(path, name)
            content.append(fn)
            #print(content)

    return content


def make_tree(path):
    tree = dict(name=path, children=[])
    try: lst = os.listdir(path)
    except OSError: pass
    else:
        for name in lst:
            fn = os.path.join(path, name)
            if os.path.isdir(fn):
                tree['children'].append(make_tree(fn))
            else:
                tree['children'].append(dict(name=fn))
    return tree

def make_dirs():
    # os.mkdir('static')
    # os.mkdir('tmp')
    # os.mkdir('app')
    # os.mkdir('app/templates')
    # os.mkdir('app/static')
    pass

"""
@app.route('//', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['file']
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return redirect(url_for('index'))
    return
"""

"""
@app.route("/download/<path:path>")
def download_file(path):
    return send_file(path)
@app.route('/view_dir', methods = ['POST'])
def get_dir_files():
    fe = FolderElement("a", "b", "c", "e")

    print(json.dumps(fe, cls=FolderElementEncoder))

    new_dir = request.form['path_dir']

    content = list()

    try:
        lst = os.listdir(new_dir[1:-1])
        print(lst)
    except OSError:
        pass
    else:
        for name in lst:
            fn = os.path.join(new_dir, name)
            content.append(fn)
            print(content)

    return json.dumps(content)

"""