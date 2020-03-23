from flask_wtf import FlaskForm
from wtforms import TextField, BooleanField
from wtforms.validators import Required


class SearchBarForm():
    search_bar = TextField('search', validators = [Required()])


class LoginForm(FlaskForm):
    search = TextField('search', validators = [Required()])

