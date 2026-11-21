import tempfile
import unittest
import os
from io import BytesIO
from pathlib import Path

from sqlalchemy import create_engine

import app as kazoku_app


class KazokuAppTestCase(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.original_engine = kazoku_app.engine
        self.original_engine.dispose()
        kazoku_app.engine = create_engine(
            f"sqlite:///{(Path(self.tempdir.name) / 'test.db').as_posix()}",
            connect_args={"check_same_thread": False},
        )
        kazoku_app.app.config.update(TESTING=True, SECRET_KEY="test-secret")
        kazoku_app.init_db()
        self.client = kazoku_app.app.test_client()

    def tearDown(self):
        kazoku_app.engine.dispose()
        kazoku_app.engine = self.original_engine
        self.tempdir.cleanup()

    def test_events_are_public_and_only_sensei_can_publish(self):
        self.assertEqual(self.client.get("/api/events").status_code, 200)

        response = self.client.post(
            "/api/register",
            json={
                "name": "Aluno Kazoku",
                "email": "aluno@example.com",
                "password": "Senha-Teste123!",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json["role"], "student")

        response = self.client.post(
            "/api/events",
            data={
                "title": "Exame de faixas",
                "date": "2026-12-12",
                "image": (BytesIO(b"fake-image"), "evento.jpg"),
            },
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 403)

    def test_sensei_config_can_publish_event(self):
        os.environ["KAZOKU_SENSEI_EMAIL"] = "sensei@example.com"
        try:
            self.client.post(
                "/api/register",
                json={
                    "name": "Sensei Kazoku",
                    "email": "sensei@example.com",
                    "password": "Senha-Teste123!",
                },
            )
            response = self.client.post(
                "/api/events",
                data={
                    "title": "Campeonato",
                    "date": "2026-12-20",
                    "image": (BytesIO(b"fake-image"), "campeonato.png"),
                },
                content_type="multipart/form-data",
            )
            self.assertEqual(response.status_code, 201)
            self.assertEqual(len(self.client.get("/api/events").json["events"]), 1)
        finally:
            os.environ.pop("KAZOKU_SENSEI_EMAIL", None)

    def test_homepage_and_static_files_load(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Karat\xc3\xaa Kyokushin", response.data)
        response.close()

        for path in ("/styles.css", "/app.js"):
            asset_response = self.client.get(path)
            self.assertEqual(asset_response.status_code, 200)
            asset_response.close()

    def test_register_login_and_profile_session(self):
        response = self.client.post(
            "/api/register",
            json={
                "name": "Pessoa Kazoku",
                "email": "pessoa@example.com",
                "password": "Senha-Teste123!",
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json["email"], "pessoa@example.com")
        self.assertEqual(self.client.get("/api/me").json["user"]["name"], "Pessoa Kazoku")

        self.client.post("/api/logout")
        self.assertIsNone(self.client.get("/api/me").json["user"])

        response = self.client.post(
            "/api/login",
            json={"email": "pessoa@example.com", "password": "Senha-Teste123!"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["name"], "Pessoa Kazoku")

    def test_duplicate_email_is_rejected(self):
        payload = {
            "name": "Pessoa Kazoku",
            "email": "pessoa@example.com",
            "password": "Senha-Teste123!",
        }
        self.assertEqual(self.client.post("/api/register", json=payload).status_code, 201)
        response = self.client.post("/api/register", json=payload)

        self.assertEqual(response.status_code, 409)

    def test_password_policy_rejects_weak_passwords(self):
        response = self.client.post(
            "/api/register",
            json={
                "name": "Pessoa Kazoku",
                "email": "pessoa@example.com",
                "password": "123456",
            },
        )

        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
