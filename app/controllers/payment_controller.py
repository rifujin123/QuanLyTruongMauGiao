from flask import Blueprint, render_template
from flask_login import current_user

from app.models.Models import TuitionFee
from app.controllers.page_routes import roles_required

payment_bp = Blueprint("payment", __name__)


@payment_bp.route("/payment/<int:tuition_id>")
@roles_required('Parent', 'Teacher', 'Admin')
def payment_detail(tuition_id):
    tuition = TuitionFee.query.get_or_404(tuition_id)

    BANK_BIN = "970436"
    ACCOUNT_NO = "9783757763"
    ACCOUNT_NAME = "KHOI DEP TRAI"
    TEMPLATE = "compact"

    amount = tuition.total
    description = f"HP-{tuition.student_id}-{tuition.month:02d}/{tuition.year}"

    qr_url = (
        f"https://img.vietqr.io/image/{BANK_BIN}-{ACCOUNT_NO}-{TEMPLATE}.png"
        f"?amount={int(amount)}&addInfo={description}&accountName={ACCOUNT_NAME}"
    )

    return render_template("payment.html", qr_url=qr_url, tuition=tuition)


@payment_bp.route("/payment/<int:tuition_id>/receipt")
@roles_required('Parent', 'Teacher', 'Admin')
def payment_receipt(tuition_id):
    tuition = TuitionFee.query.get_or_404(tuition_id)
    return render_template("receipt.html", tuition=tuition)
