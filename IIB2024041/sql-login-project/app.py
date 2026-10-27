from flask import Flask, request, render_template, redirect, session
import sqlite3

app = Flask(__name__)
app.secret_key = "demo-secret-key"

DATABASE = "users.db"


def init_db():
    conn = sqlite3.connect(DATABASE)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL
        )
    """)

    existing = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]

    if existing == 0:
        conn.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            ("admin", "admin123")
        )

        conn.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            ("student", "student123")
        )

    conn.commit()
    conn.close()


@app.route("/", methods=["GET", "POST"])
def login():

    message = ""

    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]

        # INTENTIONALLY VULNERABLE
        query = (
            "SELECT * FROM users WHERE username = '"
            + username
            + "' AND password = '"
            + password
            + "'"
        )

        conn = sqlite3.connect(DATABASE)
        user = conn.execute(query).fetchone()
        conn.close()

        if user:
            session["username"] = user[1]
            return redirect("/dashboard")
        else:
            message = "Invalid username or password"

    return render_template("login.html", message=message)


@app.route("/dashboard")
def dashboard():

    if "username" not in session:
        return redirect("/")

    return f"""
        <h1>Login Successful</h1>
        <p>Welcome, {session["username"]}!</p>
        <a href="/logout">Logout</a>
    """


@app.route("/logout")
def logout():

    session.clear()
    return redirect("/")


if __name__ == "__main__":
    init_db()
    app.run(debug=True)