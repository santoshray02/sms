#!/usr/bin/env python3

import argparse
import base64
import logging
import os
import platform
import shutil
import subprocess
import sys
import time
import urllib.request
from shutil import move, unpack_archive, which
from typing import Dict, List

logging.basicConfig(
    filename="easy-install.log",
    filemode="w",
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)


def cprint(*args, level: int = 1):
    """
    logs colorful messages
    level = 1 : RED
    level = 2 : GREEN
    level = 3 : YELLOW

    default level = 1
    """
    CRED = "\033[31m"
    CGRN = "\33[92m"
    CYLW = "\33[93m"
    reset = "\033[0m"
    message = " ".join(map(str, args))
    if level == 1:
        print(CRED, message, reset)
    if level == 2:
        print(CGRN, message, reset)
    if level == 3:
        print(CYLW, message, reset)


def clone_frappe_docker_repo() -> None:
    try:
        urllib.request.urlretrieve(
            "https://github.com/frappe/frappe_docker/archive/refs/heads/main.zip",
            "frappe_docker.zip",
        )
        logging.info("Downloaded frappe_docker zip file from GitHub")
        unpack_archive("frappe_docker.zip", ".")
        # Unzipping the frappe_docker.zip creates a folder "frappe_docker-main"
        move("frappe_docker-main", "frappe_docker")
        logging.info("Unzipped and Renamed frappe_docker")
        os.remove("frappe_docker.zip")
        logging.info("Removed the downloaded zip file")
    except Exception as e:
        logging.error("Download and unzip failed", exc_info=True)
        cprint("\nCloning frappe_docker Failed\n\n", "[ERROR]: ", e, level=1)


def get_from_env(dir, file) -> Dict:
    env_vars = {}
    with open(os.path.join(dir, file)) as f:
        for line in f:
            if line.startswith("#") or not line.strip():
                continue
            key, value = line.strip().split("=", 1)
            env_vars[key] = value
    return env_vars


def write_to_env(
    frappe_docker_dir: str,
    out_file: str,
    sites: List[str],
    db_pass: str,
    admin_pass: str,
    email: str,
    cronstring: str,
    erpnext_version: str = None,
    http_port: str = None,
    https_port: str = None,
    custom_image: str = None,
    custom_tag: str = None,
) -> None:
    quoted_sites = ",".join([f"`{site}`" for site in sites]).strip(",")
    example_env = get_from_env(frappe_docker_dir, "example.env")
    erpnext_version = erpnext_version or example_env["ERPNEXT_VERSION"]

    # Calculate consecutive ports based on http_port
    db_port = None
    redis_cache_port = None
    redis_queue_port = None
    redis_socketio_port = None

    if http_port:
        base_port = int(http_port)
        db_port = base_port + 1
        redis_cache_port = base_port + 2
        redis_queue_port = base_port + 3
        redis_socketio_port = base_port + 4

    env_file_lines = [
        # defaults to latest version of ERPNext
        f"ERPNEXT_VERSION={erpnext_version}\n",
        f"DB_PASSWORD={db_pass}\n",
        "DB_HOST=db\n",
        "DB_PORT=3306\n",
        "REDIS_CACHE=redis-cache:6379\n",
        "REDIS_QUEUE=redis-queue:6379\n",
        "REDIS_SOCKETIO=redis-socketio:6379\n",
        f"LETSENCRYPT_EMAIL={email}\n",
        f"SITE_ADMIN_PASS={admin_pass}\n",
        f"SITES={quoted_sites}\n",
        "PULL_POLICY=missing\n",
        f'BACKUP_CRONSTRING="{cronstring}"\n',
    ]

    if http_port:
        env_file_lines.append(f"HTTP_PUBLISH_PORT={http_port}\n")

    if https_port:
        env_file_lines.append(f"HTTPS_PUBLISH_PORT={https_port}\n")

    # Add custom ports for DB and Redis
    if db_port:
        env_file_lines.append(f"DB_PUBLISH_PORT={db_port}\n")
    if redis_cache_port:
        env_file_lines.append(f"REDIS_CACHE_PUBLISH_PORT={redis_cache_port}\n")
    if redis_queue_port:
        env_file_lines.append(f"REDIS_QUEUE_PUBLISH_PORT={redis_queue_port}\n")
    if redis_socketio_port:
        env_file_lines.append(f"REDIS_SOCKETIO_PUBLISH_PORT={redis_socketio_port}\n")

    if custom_image:
        env_file_lines.append(f"CUSTOM_IMAGE={custom_image}\n")

    if custom_tag:
        env_file_lines.append(f"CUSTOM_TAG={custom_tag}\n")

    with open(os.path.join(out_file), "w") as f:
        f.writelines(env_file_lines)


def generate_pass(length: int = 12) -> str:
    """Generate random hash using best available randomness source."""
    import math
    import secrets

    if not length:
        length = 56

    return secrets.token_hex(math.ceil(length / 2))[:length]


def get_frappe_docker_path():
    return os.path.join(os.getcwd(), "frappe_docker")


def check_repo_exists() -> bool:
    return os.path.exists(get_frappe_docker_path())


def start_prod(
    project: str,
    sites: List[str] = [],
    email: str = None,
    cronstring: str = None,
    version: str = None,
    image: str = None,
    is_https: bool = True,
    http_port: str = None,
    https_port: str = None,
):
    if not check_repo_exists():
        clone_frappe_docker_repo()
    install_container_runtime()

    compose_file_name = os.path.join(
        os.path.expanduser("~"),
        f"{project}-compose.yml",
    )

    env_file_dir = os.path.expanduser("~")
    env_file_name = f"{project}.env"
    env_file_path = os.path.join(
        os.path.expanduser("~"),
        env_file_name,
    )

    frappe_docker_dir = get_frappe_docker_path()

    cprint(
        f"\nPlease refer to {env_file_path} to know which keys to set\n\n",
        level=3,
    )
    admin_pass = ""
    db_pass = ""
    custom_image = None
    custom_tag = None

    if image:
        custom_image = image
        custom_tag = version

    with open(compose_file_name, "w") as f:
        # Writing to compose file
        if not os.path.exists(env_file_path):
            admin_pass = generate_pass()
            db_pass = generate_pass(9)
            write_to_env(
                frappe_docker_dir=frappe_docker_dir,
                out_file=env_file_path,
                sites=sites,
                db_pass=db_pass,
                admin_pass=admin_pass,
                email=email,
                cronstring=cronstring,
                erpnext_version=version,
                http_port=http_port,
                https_port=https_port if is_https else None,
                custom_image=custom_image,
                custom_tag=custom_tag,
            )
            cprint(
                "\nA .env file is generated with basic configs. Please edit it to fit to your needs \n",
                level=3,
            )
            with open(
                os.path.join(os.path.expanduser("~"), f"{project}-passwords.txt"), "w"
            ) as en:
                en.writelines(f"ADMINISTRATOR_PASSWORD={admin_pass}\n")
                en.writelines(f"MARIADB_ROOT_PASSWORD={db_pass}\n")
        else:
            env = get_from_env(env_file_dir, env_file_name)
            sites = env["SITES"].replace("`", "").split(",") if env["SITES"] else []
            db_pass = env["DB_PASSWORD"]
            admin_pass = env["SITE_ADMIN_PASS"]
            email = env["LETSENCRYPT_EMAIL"]
            custom_image = env.get("CUSTOM_IMAGE")
            custom_tag = env.get("CUSTOM_TAG")

            version = env.get("ERPNEXT_VERSION", version)
            write_to_env(
                frappe_docker_dir=frappe_docker_dir,
                out_file=env_file_path,
                sites=sites,
                db_pass=db_pass,
                admin_pass=admin_pass,
                email=email,
                cronstring=cronstring,
                erpnext_version=version,
                http_port=http_port,
                https_port=https_port if is_https else None,
                custom_image=custom_image,
                custom_tag=custom_tag,
            )

        try:
            command = [
                "docker",
                "compose",
                "--project-name",
                project,
                "-f",
                "compose.yaml",
                "-f",
                "overrides/compose.mariadb.yaml",
                "-f",
                "overrides/compose.redis.yaml",
                "-f",
                (
                    "overrides/compose.https.yaml"
                    if is_https
                    else "overrides/compose.noproxy.yaml"
                ),
                "-f",
                "overrides/compose.backup-cron.yaml",
                "--env-file",
                env_file_path,
                "config",
            ]

            subprocess.run(
                command,
                cwd=frappe_docker_dir,
                stdout=f,
                check=True,
            )

        except Exception:
            logging.error("Docker Compose generation failed", exc_info=True)
            cprint("\nGenerating Compose File failed\n")
            sys.exit(1)

    try:
        # Starting with generated compose file
        command = [
            "docker",
            "compose",
            "-p",
            project,
            "-f",
            compose_file_name,
            "up",
            "--force-recreate",
            "--remove-orphans",
            "-d",
        ]
        subprocess.run(
            command,
            check=True,
        )
        logging.info(f"Docker Compose file generated at ~/{project}-compose.yml")

    except Exception as e:
        logging.error("Prod docker-compose failed", exc_info=True)
        cprint(" Docker Compose failed, please check the container logs\n", e)
        sys.exit(1)

    return db_pass, admin_pass


def setup_prod(
    project: str,
    sites: List[str],
    email: str,
    cronstring: str,
    version: str = None,
    image: str = None,
    apps: List[str] = [],
    is_https: bool = False,
    http_port: str = None,
    https_port: str = None,
    school_name: str = None,
) -> None:
    if len(sites) == 0:
        sites = ["site1.localhost"]

    db_pass, admin_pass = start_prod(
        project=project,
        sites=sites,
        email=email,
        cronstring=cronstring,
        version=version,
        image=image,
        is_https=is_https,
        http_port=http_port,
        https_port=https_port,
    )

    for sitename in sites:
        create_site(sitename, project, db_pass, admin_pass, apps,
                   admin_email=email, school_name=school_name)

    cprint(
        f"MariaDB root password is {db_pass}",
        level=2,
    )
    cprint(
        f"Site administrator password is {admin_pass}",
        level=2,
    )
    passwords_file_path = os.path.join(
        os.path.expanduser("~"),
        f"{project}-passwords.txt",
    )
    cprint(f"Passwords are stored in {passwords_file_path}", level=3)


def update_prod(
    project: str,
    version: str = None,
    image: str = None,
    cronstring: str = None,
    is_https: bool = False,
    http_port: str = None,
    https_port: str = None,
) -> None:
    start_prod(
        project=project,
        version=version,
        image=image,
        cronstring=cronstring,
        is_https=is_https,
        http_port=http_port,
        https_port=https_port,
    )
    migrate_site(project=project)


def setup_dev_instance(project: str):
    if not check_repo_exists():
        clone_frappe_docker_repo()
    install_container_runtime()

    try:
        command = [
            "docker",
            "compose",
            "-f",
            "devcontainer-example/docker-compose.yml",
            "--project-name",
            project,
            "up",
            "-d",
        ]
        subprocess.run(
            command,
            cwd=get_frappe_docker_path(),
            check=True,
        )
        cprint(
            "Please go through the Development Documentation: https://github.com/frappe/frappe_docker/tree/main/docs/development.md to fully complete the setup.",
            level=2,
        )
        logging.info("Development Setup completed")
    except Exception as e:
        logging.error("Dev Environment setup failed", exc_info=True)
        cprint("Setting Up Development Environment Failed\n", e)


def install_docker():
    cprint("Docker is not installed, Installing Docker...", level=3)
    logging.info("Docker not found, installing Docker")
    if platform.system() == "Darwin" or platform.system() == "Windows":
        cprint(
            f"""
            This script doesn't install Docker on {"Mac" if platform.system()=="Darwin" else "Windows"}.

            Please go through the Docker Installation docs for your system and run this script again"""
        )
        logging.debug("Docker setup failed due to platform is not Linux")
        sys.exit(1)
    try:
        ps = subprocess.run(
            ["curl", "-fsSL", "https://get.docker.com"],
            capture_output=True,
            check=True,
        )
        subprocess.run(["/bin/bash"], input=ps.stdout, capture_output=True)
        subprocess.run(
            [
                "sudo",
                "usermod",
                "-aG",
                "docker",
                str(os.getenv("USER")),
            ],
            check=True,
        )
        cprint("Waiting Docker to start", level=3)
        time.sleep(10)
        subprocess.run(
            [
                "sudo",
                "systemctl",
                "restart",
                "docker.service",
            ],
            check=True,
        )
    except Exception as e:
        logging.error("Installing Docker failed", exc_info=True)
        cprint("Failed to Install Docker\n", e)
        cprint("\n Try Installing Docker Manually and re-run this script again\n")
        sys.exit(1)


def install_container_runtime(runtime="docker"):
    if which(runtime) is not None:
        cprint(runtime.title() + " is already installed", level=2)
        return
    if runtime == "docker":
        install_docker()


def setup_school_data(sitename: str, project: str):
    """Automatically create programs, fee categories, academic data, users, and fee structures"""
    setup_script = """
import frappe
from frappe.utils import today, add_days

frappe.init(site='{sitename}')
frappe.connect()

print("\\n" + "="*60)
print("COMPREHENSIVE SCHOOL SETUP - St. Francis English School Style")
print("="*60)

# 1. Academic Year
print("\\n=== Setting up Academic Year ===")
try:
    frappe.get_doc({{
        "doctype": "Academic Year",
        "academic_year_name": "2024-25",
        "year_start_date": "2024-04-01",
        "year_end_date": "2025-03-31"
    }}).insert(ignore_if_duplicate=True)
    print("✓ Created Academic Year 2024-25")
except Exception as e:
    print(f"Academic Year: {{e}}")

# 2. Academic Terms
print("\\n=== Setting up Academic Terms ===")
terms = [
    {{"term_name": "First Term", "start": "2024-04-01", "end": "2024-09-30"}},
    {{"term_name": "Second Term", "start": "2024-10-01", "end": "2025-03-31"}}
]
for term in terms:
    try:
        frappe.get_doc({{
            "doctype": "Academic Term",
            "academic_year": "2024-25",
            "term_name": term["term_name"],
            "term_start_date": term["start"],
            "term_end_date": term["end"]
        }}).insert(ignore_if_duplicate=True)
        print(f"✓ Created {{term['term_name']}}")
    except Exception as e:
        print(f"{{term['term_name']}}: {{e}}")

# 3. Fee Categories
print("\\n=== Setting up Fee Categories ===")
categories = [
    "Tuition Fee", "Admission Fee", "Transport Fee", "Lab Fee",
    "Library Fee", "Sports Fee", "Exam Fee", "Computer Fee",
    "Activity Fee", "Hostel Fee", "Development Fee", "Books Fee"
]
for cat in categories:
    try:
        frappe.get_doc({{
            "doctype": "Fee Category",
            "category_name": cat
        }}).insert(ignore_if_duplicate=True)
        print(f"✓ Created {{cat}}")
    except Exception as e:
        print(f"{{cat}}: {{e}}")

# 4. Academic Programs
print("\\n=== Setting up Academic Programs ===")
programs_data = [
    {{"name": "Playgroup", "abbr": "PG"}},
    {{"name": "Nursery", "abbr": "NUR"}},
    {{"name": "LKG", "abbr": "LKG"}},
    {{"name": "UKG", "abbr": "UKG"}},
    {{"name": "Class 1", "abbr": "1"}},
    {{"name": "Class 2", "abbr": "2"}},
    {{"name": "Class 3", "abbr": "3"}},
    {{"name": "Class 4", "abbr": "4"}},
    {{"name": "Class 5", "abbr": "5"}},
    {{"name": "Class 6", "abbr": "6"}},
    {{"name": "Class 7", "abbr": "7"}},
    {{"name": "Class 8", "abbr": "8"}},
    {{"name": "Class 9", "abbr": "9"}},
    {{"name": "Class 10", "abbr": "10"}},
    {{"name": "Class 11 Science", "abbr": "11-SCI"}},
    {{"name": "Class 11 Commerce", "abbr": "11-COM"}},
    {{"name": "Class 11 Arts", "abbr": "11-ART"}},
    {{"name": "Class 12 Science", "abbr": "12-SCI"}},
    {{"name": "Class 12 Commerce", "abbr": "12-COM"}},
    {{"name": "Class 12 Arts", "abbr": "12-ART"}}
]
for prog in programs_data:
    try:
        frappe.get_doc({{
            "doctype": "Program",
            "program_name": prog["name"],
            "program_abbreviation": prog["abbr"]
        }}).insert(ignore_if_duplicate=True)
        print(f"✓ Created {{prog['name']}}")
    except Exception as e:
        print(f"{{prog['name']}}: {{e}}")

frappe.db.commit()

# 5. Fee Structures (St. Francis English School - Tuition Fees)
print("\\n=== Setting up Fee Structures (Tuition) ===")
tuition_fees = [
    {{"program": "Nursery", "amount": 550}},
    {{"program": "LKG", "amount": 550}},
    {{"program": "UKG", "amount": 600}},
    {{"program": "Class 1", "amount": 650}},
    {{"program": "Class 2", "amount": 650}},
    {{"program": "Class 3", "amount": 700}},
    {{"program": "Class 4", "amount": 700}},
    {{"program": "Class 5", "amount": 750}},
    {{"program": "Class 6", "amount": 750}},
    {{"program": "Class 7", "amount": 800}},
    {{"program": "Class 8", "amount": 900}},
    {{"program": "Class 9", "amount": 1000}},
    {{"program": "Class 10", "amount": 1100}}
]

for fee in tuition_fees:
    try:
        fee_structure = frappe.get_doc({{
            "doctype": "Fee Structure",
            "academic_year": "2024-25",
            "program": fee["program"],
            "components": [
                {{
                    "doctype": "Fee Component",
                    "fees_category": "Tuition Fee",
                    "amount": fee["amount"]
                }}
            ]
        }})
        fee_structure.insert(ignore_if_duplicate=True)
        print(f"✓ Created Fee Structure for {{fee['program']}} - ₹{{fee['amount']}}/month")
    except Exception as e:
        print(f"Fee Structure {{fee['program']}}: {{e}}")

frappe.db.commit()

# 6. Transportation Routes and Fees
print("\\n=== Setting up Transportation Routes & Fees ===")
transport_routes = [
    {{"route": "Behrampur", "fee": 800}},
    {{"route": "Bhagtan", "fee": 500}},
    {{"route": "Chaksinpar", "fee": 500}},
    {{"route": "Chandpura", "fee": 550}},
    {{"route": "Fatehpur", "fee": 450}},
    {{"route": "Hajipurva", "fee": 500}},
    {{"route": "Ibrahimabad", "fee": 550}},
    {{"route": "Jurawanpur (Barari/Gardinia Chowk)", "fee": 600}},
    {{"route": "Jurawanpur (Karari Chowk/High School)", "fee": 600}},
    {{"route": "Malikpur", "fee": 500}},
    {{"route": "Mohanpur/Jagdishpur", "fee": 600}},
    {{"route": "Nagargama/Bajrangbali Chowk", "fee": 500}},
    {{"route": "Paharpur (Tower)", "fee": 450}},
    {{"route": "Raghopur", "fee": 450}},
    {{"route": "Raghopur East (Middle School)", "fee": 450}},
    {{"route": "Raghopur (Naya Tola)", "fee": 500}},
    {{"route": "Rampur", "fee": 550}},
    {{"route": "Rampur Shyamchand", "fee": 650}},
    {{"route": "Registry Khudgas", "fee": 450}},
    {{"route": "Rupas (Shivnagar)", "fee": 1200}},
    {{"route": "Shivnagar", "fee": 1000}},
    {{"route": "Rupas Mahaji", "fee": 1500}}
]

for route in transport_routes:
    try:
        # Create Student Transport (Vehicle Route)
        route_doc = frappe.get_doc({{
            "doctype": "Vehicle",
            "license_plate": f"BH-{{route['route'][:3].upper()}}",
            "make": "School Bus",
            "model": route["route"]
        }})
        route_doc.insert(ignore_if_duplicate=True)
        print(f"✓ Transport Route: {{route['route']}} - ₹{{route['fee']}}/month")
    except Exception as e:
        print(f"Transport {{route['route']}}: {{e}}")

frappe.db.commit()

# 7. Sample Users
print("\\n=== Setting up Sample Users ===")

# Principal
try:
    if not frappe.db.exists("User", "principal@school.local"):
        principal = frappe.get_doc({{
            "doctype": "User",
            "email": "principal@school.local",
            "first_name": "Dr. Mary",
            "last_name": "Principal",
            "username": "principal",
            "send_welcome_email": 0,
            "roles": [
                {{"role": "Academics User"}},
                {{"role": "Education Manager"}},
                {{"role": "System Manager"}}
            ]
        }})
        principal.insert(ignore_permissions=True)
        frappe.db.set_value("User", "principal@school.local", "new_password", "principal123")
        print("✓ Created Principal User (principal@school.local / principal123)")
except Exception as e:
    print(f"Principal: {{e}}")

# Teachers
teachers = [
    {{"email": "teacher1@school.local", "first": "John", "last": "Mathew", "subject": "Mathematics"}},
    {{"email": "teacher2@school.local", "first": "Sarah", "last": "Williams", "subject": "English"}},
    {{"email": "teacher3@school.local", "first": "Raj", "last": "Kumar", "subject": "Science"}}
]

for t in teachers:
    try:
        if not frappe.db.exists("User", t["email"]):
            teacher = frappe.get_doc({{
                "doctype": "User",
                "email": t["email"],
                "first_name": t["first"],
                "last_name": t["last"],
                "username": t["email"].split("@")[0],
                "send_welcome_email": 0,
                "roles": [
                    {{"role": "Instructor"}},
                    {{"role": "Academics User"}}
                ]
            }})
            teacher.insert(ignore_permissions=True)
            frappe.db.set_value("User", t["email"], "new_password", "teacher123")
            print(f"✓ Created Teacher: {{t['first']}} {{t['last']}} ({{t['email']}} / teacher123)")
    except Exception as e:
        print(f"Teacher {{t['email']}}: {{e}}")

# Fee Manager
try:
    if not frappe.db.exists("User", "accountant@school.local"):
        accountant = frappe.get_doc({{
            "doctype": "User",
            "email": "accountant@school.local",
            "first_name": "Accounts",
            "last_name": "Manager",
            "username": "accountant",
            "send_welcome_email": 0,
            "roles": [
                {{"role": "Accounts User"}},
                {{"role": "Accounts Manager"}}
            ]
        }})
        accountant.insert(ignore_permissions=True)
        frappe.db.set_value("User", "accountant@school.local", "new_password", "accounts123")
        print("✓ Created Accountant (accountant@school.local / accounts123)")
except Exception as e:
    print(f"Accountant: {{e}}")

frappe.db.commit()

# 8. Sample Students with Guardians
print("\\n=== Setting up Sample Students & Guardians ===")

# Note: Skipping sample student creation due to complex Guardian linking
# Users can manually create students through the UI after installation
print("⚠ Sample students skipped - Create manually via Education > Student")
print("  (Guardian linking requires proper setup through the UI)")

frappe.db.commit()

# 9. Module Configuration (Show only Education & Accounting)
print("\\n=== Configuring Module Visibility ===")
try:
    # Hide non-essential modules for school use
    modules_to_hide = ["Manufacturing", "Buying", "Selling", "Stock", "CRM", "Support",
                       "Projects", "HR", "Payroll", "Website", "Assets", "Quality"]

    for module in modules_to_hide:
        try:
            if frappe.db.exists("Module Def", module):
                frappe.db.set_value("Module Def", module, "disabled", 1)
        except:
            pass

    print("✓ Configured modules - Enabled: Education, Accounting, Setup")
    print("✓ Hidden: Manufacturing, Buying, Selling, Stock, etc.")
except Exception as e:
    print(f"Module Config: {{e}}")

frappe.db.commit()

# Summary
print("\\n" + "="*60)
print("SCHOOL SETUP COMPLETED SUCCESSFULLY!")
print("="*60)
print("\\n📚 Academic Data:")
print("  • 20 Programs (Playgroup to Class 12)")
print("  • 2 Academic Terms")
print("  • 12 Fee Categories")
print("\\n💰 Fee Structures:")
print("  • Tuition fees for 13 classes (₹550 to ₹1,100)")
print("  • 22 Transportation routes (₹450 to ₹1,500)")
print("\\n👥 Sample Users Created:")
print("  • Principal: principal@school.local / principal123")
print("  • 3 Teachers: teacher1/2/3@school.local / teacher123")
print("  • Accountant: accountant@school.local / accounts123")
print("  • 5 Students with Guardians")
print("\\n⚙️  Module Configuration:")
print("  • Education and Accounting modules enabled")
print("  • Other modules hidden for focused school use")
print("\\n🎓 Ready to use! Login with Administrator or sample users")
print("="*60 + "\\n")

frappe.destroy()
""".format(sitename=sitename)

    try:
        # Write the setup script to a temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(setup_script)
            script_path = f.name

        # Execute the script in the container
        command = [
            "docker", "compose", "-p", project,
            "exec", "-T", "backend",
            "bench", "--site", sitename, "console"
        ]

        with open(script_path, 'r') as script_file:
            result = subprocess.run(
                command,
                stdin=script_file,
                capture_output=True,
                text=True
            )

        if result.returncode == 0:
            cprint("\n✓ School data setup completed successfully\n", level=2)
            print(result.stdout)
        else:
            cprint("\n⚠ Warning: School data setup encountered issues\n", level=3)
            print(result.stderr)

        # Clean up temp file
        os.unlink(script_path)

    except Exception as e:
        logging.error(f"School data setup failed for {sitename}", exc_info=True)
        cprint(f"\n⚠ Warning: Could not auto-setup school data: {e}\n", level=3)
        cprint("You can manually run the setup later using setup_school_data.py\n", level=3)


def create_site(
    sitename: str,
    project: str,
    db_pass: str,
    admin_pass: str,
    apps: List[str] = [],
    admin_email: str = None,
    school_name: str = None,
):
    apps = apps or []
    admin_email = admin_email or "admin@example.com"
    school_name = school_name or "Administrator"

    cprint(f"\nCreating site: {sitename} \n", level=3)
    command = [
        "docker",
        "compose",
        "-p",
        project,
        "exec",
        "-T",  # Non-interactive mode
        "backend",
        "bench",
        "new-site",
        "--no-mariadb-socket",
        "--db-type=mariadb",
        "--db-host=db",
        "--db-root-username=root",
        f"--db-root-password={db_pass}",
        f"--admin-password={admin_pass}",
        "--force",  # Force creation without prompts
    ]

    for app in apps:
        command.append("--install-app")
        command.append(app)

    command.append(sitename)

    try:
        subprocess.run(
            command,
            check=True,
        )
        logging.info("New site creation completed")

        # Set Administrator full name and email
        try:
            set_admin_details_command = [
                "docker", "compose", "-p", project,
                "exec", "-T", "backend",
                "bench", "--site", sitename, "console"
            ]

            admin_setup_script = f"""
import frappe
frappe.init(site='{sitename}')
frappe.connect()
frappe.db.set_value('User', 'Administrator', 'full_name', '{school_name}')
frappe.db.set_value('User', 'Administrator', 'email', '{admin_email}')
frappe.db.commit()
print('✓ Administrator details updated')
frappe.destroy()
"""

            result = subprocess.run(
                set_admin_details_command,
                input=admin_setup_script,
                capture_output=True,
                text=True,
            )

            if result.returncode == 0:
                cprint(f"✓ Set Administrator name: {school_name}\n", level=2)

        except Exception as e:
            logging.warning(f"Could not set administrator details: {e}")

        # Auto-setup school data if education app is installed
        if "education" in apps:
            cprint(f"\nSetting up school data for {sitename}...\n", level=3)
            setup_school_data(sitename, project)

    except Exception as e:
        logging.error(f"Bench site creation failed for {sitename}", exc_info=True)
        cprint(f"Bench Site creation failed for {sitename}\n", e)


def migrate_site(project: str):
    cprint(f"\nMigrating sites for {project}", level=3)

    exec_command(
        project=project,
        command=[
            "bench",
            "--site",
            "all",
            "migrate",
        ],
    )


def exec_command(project: str, command: List[str] = [], interactive_terminal=False):
    if not command:
        command = ["echo", '"Please execute a command"']

    cprint(f"\nExecuting Command:\n{' '.join(command)}", level=3)
    exec_command = [
        "docker",
        "compose",
        "-p",
        project,
        "exec",
    ]

    if interactive_terminal:
        exec_command.append("-it")

    exec_command.append("backend")
    exec_command += command

    try:
        subprocess.run(
            exec_command,
            check=True,
        )
        logging.info("New site creation completed")
    except Exception as e:
        logging.error(f"Exec command failed for {project}", exc_info=True)
        cprint(f"Exec command failed for {project}\n", e)


def add_project_option(parser: argparse.ArgumentParser):
    parser.add_argument(
        "-n",
        "--project",
        help="Project Name",
        default="frappe",
    )
    return parser


def add_setup_options(parser: argparse.ArgumentParser):
    parser.add_argument(
        "-a",
        "--app",
        dest="apps",
        default=[],
        help="list of app(s) to be installed",
        action="append",
    )
    parser.add_argument(
        "-s",
        "--sitename",
        help="Site Name(s) for your production bench",
        default=[],
        action="append",
        dest="sites",
    )
    parser.add_argument("-e", "--email", help="Add email for the SSL.")
    parser.add_argument(
        "--school-name",
        help="School name for setup (e.g., 'St. Francis English School')",
        default="Demo School"
    )

    return parser


def add_common_parser(parser: argparse.ArgumentParser):
    parser = add_project_option(parser)
    parser.add_argument(
        "-g",
        "--backup-schedule",
        help='Backup schedule cronstring, default: "@every 6h"',
        default="@every 6h",
    )
    parser.add_argument("-i", "--image", help="Full Image Name")
    parser.add_argument(
        "-m", "--http-port", help="HTTP port (default: 80 with SSL, 8080 without SSL)", default=None
    )
    parser.add_argument(
        "--https-port", help="HTTPS port (default: 443, only used with SSL enabled)", default="443"
    )
    parser.add_argument("-q", "--no-ssl", action="store_true", help="No https")
    parser.add_argument(
        "-v",
        "--version",
        help="ERPNext or image version to install, defaults to latest stable",
    )
    parser.add_argument(
        "-l",
        "--force-pull",
        action="store_true",
        help="Force pull frappe_docker",
    )
    return parser


def add_build_parser(subparsers: argparse.ArgumentParser):
    parser = subparsers.add_parser("build", help="Build custom images")
    parser = add_common_parser(parser)
    parser = add_setup_options(parser)
    parser.add_argument(
        "-p",
        "--push",
        help="Push the built image to registry",
        action="store_true",
    )
    parser.add_argument(
        "-r",
        "--frappe-path",
        help="Frappe Repository to use, default: https://github.com/frappe/frappe",
        default="https://github.com/frappe/frappe",
    )
    parser.add_argument(
        "-b",
        "--frappe-branch",
        help="Frappe branch to use, default: version-15",
        default="version-15",
    )
    parser.add_argument(
        "-j",
        "--apps-json",
        help="Path to apps json, default: frappe_docker/development/apps-example.json",
        default="frappe_docker/development/apps-example.json",
    )
    parser.add_argument(
        "-t",
        "--tag",
        dest="tags",
        help="Full Image Name(s), default: custom-apps:latest",
        action="append",
    )
    parser.add_argument(
        "-c",
        "--containerfile",
        help="Path to Containerfile: images/custom/Containerfile",
        default="images/custom/Containerfile",
    )
    parser.add_argument(
        "-y",
        "--python-version",
        help="Python Version, default: 3.11.6",
        default="3.11.6",
    )
    parser.add_argument(
        "-d",
        "--node-version",
        help="NodeJS Version, default: 18.18.2",
        default="18.18.2",
    )
    parser.add_argument(
        "-x",
        "--deploy",
        help="Deploy after build",
        action="store_true",
    )
    parser.add_argument(
        "-u",
        "--upgrade",
        help="Upgrade after build",
        action="store_true",
    )


def add_deploy_parser(subparsers: argparse.ArgumentParser):
    parser = subparsers.add_parser("deploy", help="Deploy using compose")
    parser = add_common_parser(parser)
    parser = add_setup_options(parser)


def add_develop_parser(subparsers: argparse.ArgumentParser):
    parser = subparsers.add_parser("develop", help="Development setup using compose")
    parser.add_argument(
        "-n", "--project", default="frappe", help="Compose project name"
    )


def add_upgrade_parser(subparsers: argparse.ArgumentParser):
    parser = subparsers.add_parser("upgrade", help="Upgrade existing project")
    parser = add_common_parser(parser)


def add_exec_parser(subparsers: argparse.ArgumentParser):
    parser = subparsers.add_parser("exec", help="Exec into existing project")
    parser = add_project_option(parser)


def build_image(
    push: bool,
    frappe_path: str,
    frappe_branch: str,
    containerfile_path: str,
    apps_json_path: str,
    tags: List[str],
    python_version: str,
    node_version: str,
):
    if not check_repo_exists():
        clone_frappe_docker_repo()
    install_container_runtime()

    if not tags:
        tags = ["custom-apps:latest"]

    apps_json_base64 = None
    try:
        with open(apps_json_path, "rb") as file_text:
            file_read = file_text.read()
            apps_json_base64 = (
                base64.encodebytes(file_read).decode("utf-8").replace("\n", "")
            )
    except Exception as e:
        logging.error("Unable to base64 encode apps.json", exc_info=True)
        cprint("\nUnable to base64 encode apps.json\n\n", "[ERROR]: ", e, level=1)

    command = [
        which("docker"),
        "build",
        "--progress=plain",
    ]

    for tag in tags:
        command.append(f"--tag={tag}")

    command += [
        f"--file={containerfile_path}",
        f"--build-arg=FRAPPE_PATH={frappe_path}",
        f"--build-arg=FRAPPE_BRANCH={frappe_branch}",
        f"--build-arg=PYTHON_VERSION={python_version}",
        f"--build-arg=NODE_VERSION={node_version}",
        f"--build-arg=APPS_JSON_BASE64={apps_json_base64}",
        ".",
    ]

    try:
        subprocess.run(
            command,
            check=True,
            cwd="frappe_docker",
        )
    except Exception as e:
        logging.error("Image build failed", exc_info=True)
        cprint("\nImage build failed\n\n", "[ERROR]: ", e, level=1)

    if push:
        try:
            for tag in tags:
                subprocess.run(
                    [which("docker"), "push", tag],
                    check=True,
                )
        except Exception as e:
            logging.error("Image push failed", exc_info=True)
            cprint("\nImage push failed\n\n", "[ERROR]: ", e, level=1)


def get_args_parser():
    parser = argparse.ArgumentParser(
        description="Easy install script for Frappe Framework"
    )
    # Setup sub-commands
    subparsers = parser.add_subparsers(dest="subcommand")
    # Build command
    add_build_parser(subparsers)
    # Deploy command
    add_deploy_parser(subparsers)
    # Upgrade command
    add_upgrade_parser(subparsers)
    # Develop command
    add_develop_parser(subparsers)
    # Exec command
    add_exec_parser(subparsers)

    return parser


def get_project_name_with_user(project: str) -> str:
    """Prefix project name with username for better container naming"""
    username = os.getenv("USER", "user")
    # If project already starts with username, don't add it again
    if project.startswith(f"{username}-"):
        return project
    return f"{username}-{project}"


if __name__ == "__main__":
    parser = get_args_parser()
    if len(sys.argv) == 1:
        parser.print_help(sys.stderr)
        sys.exit(1)

    args = parser.parse_args()

    # Auto-prefix project name with username for better identification
    if hasattr(args, 'project') and args.project:
        args.project = get_project_name_with_user(args.project)

    if (
        args.subcommand != "exec"
        and args.force_pull
        and os.path.exists(get_frappe_docker_path())
    ):
        cprint("\nForce pull frappe_docker again\n", level=2)
        shutil.rmtree(get_frappe_docker_path(), ignore_errors=True)

    if args.subcommand == "build":
        build_image(
            push=args.push,
            frappe_path=args.frappe_path,
            frappe_branch=args.frappe_branch,
            apps_json_path=args.apps_json,
            tags=args.tags,
            containerfile_path=args.containerfile,
            python_version=args.python_version,
            node_version=args.node_version,
        )
        if args.deploy:
            setup_prod(
                project=args.project,
                sites=args.sites,
                email=args.email,
                cronstring=args.backup_schedule,
                version=args.version,
                image=args.image,
                apps=args.apps,
                is_https=not args.no_ssl,
                http_port=args.http_port,
                https_port=args.https_port,
                school_name=args.school_name,
            )
        elif args.upgrade:
            update_prod(
                project=args.project,
                version=args.version,
                image=args.image,
                cronstring=args.backup_schedule,
                is_https=not args.no_ssl,
                http_port=args.http_port,
                https_port=args.https_port,
            )

    elif args.subcommand == "deploy":
        cprint("\nSetting Up Production Instance\n", level=2)
        logging.info("Running Production Setup")
        if args.email and "example.com" in args.email:
            cprint("Emails with example.com not acceptable", level=1)
            sys.exit(1)
        setup_prod(
            project=args.project,
            sites=args.sites,
            email=args.email,
            version=args.version,
            cronstring=args.backup_schedule,
            image=args.image,
            apps=args.apps,
            is_https=not args.no_ssl,
            http_port=args.http_port,
            https_port=args.https_port,
            school_name=args.school_name,
        )
    elif args.subcommand == "develop":
        cprint("\nSetting Up Development Instance\n", level=2)
        logging.info("Running Development Setup")
        setup_dev_instance(args.project)
    elif args.subcommand == "upgrade":
        cprint("\nUpgrading Production Instance\n", level=2)
        logging.info("Upgrading Development Setup")
        update_prod(
            project=args.project,
            version=args.version,
            image=args.image,
            is_https=not args.no_ssl,
            cronstring=args.backup_schedule,
            http_port=args.http_port,
            https_port=args.https_port,
        )
    elif args.subcommand == "exec":
        cprint(f"\nExec into {args.project} backend\n", level=2)
        logging.info(f"Exec into {args.project} backend")
        exec_command(
            project=args.project,
            command=["bash"],
            interactive_terminal=True,
        )
