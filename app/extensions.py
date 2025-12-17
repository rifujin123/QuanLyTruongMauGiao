from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user
from flask_admin import Admin, AdminIndexView, expose
from flask_babel import Babel
from flask import redirect, url_for, request

db = SQLAlchemy()
login_manager = LoginManager()
babel = Babel()

class DashboardIndexView(AdminIndexView):
    def is_accessible(self):
        if not current_user.is_authenticated:
            return False
        roles = getattr(current_user, "roles", []) or []
        return any(getattr(r, "name", "") == "Admin" for r in roles)

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for("pages.signup", next=request.url))

    @expose("/")
    def index(self):
        return self.render("admin/dashboard.html")

admin = Admin(
    name="Educa Admin",
    url="/admin-panel",
    index_view=DashboardIndexView(name="Tổng quan", url="/admin-panel"),
)
