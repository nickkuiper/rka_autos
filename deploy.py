import os
import json
import requests
import jinja2
import shutil
import re
import random
from datetime import datetime

# --- Configuration ---
API_URL = "https://europe-west1-nick-storage-backup.cloudfunctions.net/get_cars_js"
SITE_URL = "https://www.rodykuiper.nl"
OUTPUT_DIR = "dist"
TEMPLATE_DIR = "templates"
STATIC_DIRS = ["css", "js", "assets"]

# --- Helper Functions ---

def format_number(value):
    """Formats a number with Dutch locale thousands separators."""
    if value is None:
        return ""
    try:
        return f"{int(value):,}".replace(",", ".")
    except (ValueError, TypeError):
        return str(value)

def parse_price_to_number(price):
    """Extracts a number from a price string."""
    if not price or not isinstance(price, str):
        return 0
    if "verkocht" in price.lower():
        return 0
    cleaned = re.sub(r"[^\d]", "", price)
    return int(cleaned) if cleaned else 0

def get_year_from_date(date_str):
    """Extracts the year from a date string."""
    if not date_str:
        return None
    match = re.search(r"\d{4}", str(date_str))
    if match:
        return int(match.group(0))
    try:
        return datetime.strptime(str(date_str), "%Y-%m-%d").year
    except ValueError:
        return None

def create_slug(text):
    """Generates a URL-friendly slug from a string."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)  # remove non-alphanumeric characters
    text = re.sub(r'[\s-]+', '-', text).strip('-') # replace spaces/hyphens with a single hyphen
    return text

def process_car_data(car):
    """Enriches a single car object with computed properties for templating."""
    
    # Basic fields
    car['is_sold'] = 'verkocht' in (car.get('prijs') or '').lower()
    car['priceNum'] = parse_price_to_number(car.get('prijs'))
    
    # Create SEO slug
    make = car.get('merk', '')
    model = car.get('model', '')
    car['slug'] = create_slug(f"{make} {model}")
    
    # Kilometerstand
    km_stand = car.get('km-stand')
    car['km_stand_num'] = int(km_stand) if km_stand and str(km_stand).isdigit() else 0
    car['km_stand_formatted'] = format_number(km_stand)
    
    # Bouwjaar
    car['bouwjaar_year'] = get_year_from_date(car.get('bouwjaar'))
    
    # Description
    description = (car.get('uitgelichtrich') or '').strip()
    car['description_html'] = '<p>' + description.replace('\n\n', '</p><p>').replace('\n', '<br>') + '</p>' if description else '<p>Geen beschrijving beschikbaar.</p>'

    # Fiche link
    car['fiche_link'] = car.get('fiche') or car.get('ficheLink') or car.get('pdfUrl') or car.get('pdf')

    # Kleur
    kleur_parts = (car.get('kleur') or 'n.b.,n.v.t.').split(',')
    car['exterior_color'] = kleur_parts[0].strip()
    car['interior_color'] = kleur_parts[1].strip() if len(kleur_parts) > 1 else 'n.v.t.'

    # Spec cards for detail page
    car['spec_cards'] = [
        {
            'label': 'Vermogen',
            'value': car.get('pk') or 'n.b.',
            'details': [
                {'label': 'Brandstof', 'value': car.get('brandstof') or 'n.b.'},
                {'label': 'Transmissie', 'value': car.get('transmissie') or 'n.b.'},
                {'label': 'Motorinhoud', 'value': car.get('motorinhoud') or 'n.b.'},
                {'label': '0-100 km/u', 'value': car.get('0-100') or 'n.b.'},
            ],
        },
        {
            'label': 'Kilometerstand',
            'value': f"{car['km_stand_formatted']} km" if car['km_stand_formatted'] else 'n.b.',
            'details': [
                {'label': 'Bouwjaar', 'value': car['bouwjaar_year'] or 'n.b.'},
                {'label': 'APK-datum', 'value': datetime.strptime(car['apk-datum'].split('T')[0], "%Y-%m-%d").strftime("%d-%m-%Y") if car.get('apk-datum') else 'n.b.'},
                {'label': 'Gewicht', 'value': car.get('gewicht-rijklaar') or 'n.b.'},
                {'label': 'Topsnelheid', 'value': car.get('topsnelheid') or 'n.b.'},
            ],
        },
        {
            'label': 'Kleur',
            'value': car['exterior_color'],
            'details': [
                {'label': 'Interieur', 'value': car['interior_color']},
                {'label': 'Garantie', 'value': car.get('garantie') or 'n.b.'},
                {'label': 'BTW auto', 'value': 'Ja' if car.get('btw-auto') else 'Nee'},
                {'label': 'Leaseprijs', 'value': car.get('leasePrice') or 'n.b.'},
            ],
        },
    ]
    
    return car

def render_index_page(env, all_cars):
    """Renders the index page with featured cars."""
    print("Rendering index.html with featured cars...")
    try:
        # 1. Filter for available cars and select 3 random ones
        available_cars = [car for car in all_cars if not car.get('is_sold')]
        if len(available_cars) > 3:
            featured_cars = random.sample(available_cars, 3)
        else:
            featured_cars = available_cars
        print(f"Selected {len(featured_cars)} featured cars.")

        # 2. Render the car cards
        card_template = env.get_template("featured-car-card.html.j2")
        featured_html = "".join([card_template.render(car=car) for car in featured_cars])

        # 3. Read the base index.html
        with open("index.html", "r", encoding="utf-8") as f:
            index_content = f.read()

        # 4. Inject the featured cars HTML
        placeholder = '<!-- Featured cars will be injected here by deploy.py -->'
        index_content = index_content.replace(placeholder, featured_html)

        # 5. Write the final index.html to the dist directory
        with open(os.path.join(OUTPUT_DIR, "index.html"), "w", encoding="utf-8") as f:
            f.write(index_content)
        print("Rendered index.html")

    except Exception as e:
        print(f"Error rendering index.html: {e}")

# --- Main Build Script ---

def main():
    """Main function to build the static site."""
    print("Starting static site build...")

    # 1. Setup Jinja2 environment
    env = jinja2.Environment(
        loader=jinja2.FileSystemLoader(TEMPLATE_DIR),
        autoescape=jinja2.select_autoescape(['html', 'xml'])
    )

    # 2. Clean and create output directory
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)
    print(f"Cleaned and created output directory: {OUTPUT_DIR}")

    # 3. Fetch car data from API
    try:
        response = requests.get(API_URL)
        response.raise_for_status()
        all_cars_raw = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching car data: {e}")
        return

    # 4. Process all car data
    all_cars = [process_car_data(car) for car in all_cars_raw]
    print(f"Fetched and processed {len(all_cars)} cars.")

    # Sort cars by make and model for the default view
    all_cars.sort(key=lambda car: (car.get('merk', ''), car.get('model', '')))
    print("Sorted cars alphabetically by make and model.")

    # 5. Render voorraad.html
    try:
        voorraad_template = env.get_template("voorraad.html.j2")
        voorraad_html = voorraad_template.render(cars=all_cars)
        with open(os.path.join(OUTPUT_DIR, "voorraad.html"), "w", encoding="utf-8") as f:
            f.write(voorraad_html)
        print("Rendered voorraad.html")
    except jinja2.TemplateError as e:
        print(f"Error rendering voorraad.html: {e}")

    # 6. Render car detail pages
    detail_dir = os.path.join(OUTPUT_DIR, "voorraad")
    os.makedirs(detail_dir)
    try:
        detail_template = env.get_template("car-detail.html.j2")
        for car in all_cars:
            file_name = f"{car['slug']}-{car['id']}.html" if car['slug'] else f"{car['id']}.html"
            detail_html = detail_template.render(car=car)
            file_path = os.path.join(detail_dir, file_name)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(detail_html)
        print(f"Rendered {len(all_cars)} car detail pages in {detail_dir}/")
    except jinja2.TemplateError as e:
        print(f"Error rendering detail pages: {e}")

    # 7. Render index page with featured cars
    render_index_page(env, all_cars)

    # 8. Copy static assets and other root files
    for static_dir in STATIC_DIRS:
        shutil.copytree(static_dir, os.path.join(OUTPUT_DIR, static_dir))
    print(f"Copied static directories: {', '.join(STATIC_DIRS)}")
    
    # Also copy remaining root files
    root_files_to_copy = ['lease.html', 'contact.html', 'car-detail.html']
    for file_name in root_files_to_copy:
        if os.path.exists(file_name):
            shutil.copy(file_name, os.path.join(OUTPUT_DIR, file_name))
    print(f"Copied remaining root HTML files.")


    # 9. Generate sitemap.xml
    sitemap_template_str = """<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n    <url>\n        <loc>{{ site_url }}/voorraad.html</loc>\n        <lastmod>{{ now }}</lastmod>\n        <changefreq>daily</changefreq>\n        <priority>0.8</priority>\n    </url>\n    {% for car in cars %}\n    <url>\n        <loc>{{ site_url }}/voorraad/{{ car.slug }}-{{ car.id }}.html</loc>\n        <lastmod>{{ now }}</lastmod>\n        <changefreq>daily</changefreq>\n        <priority>0.6</priority>\n    </url>\n    {% endfor %}\n</urlset>"""
    try:
        sitemap_template = env.from_string(sitemap_template_str)
        sitemap_xml = sitemap_template.render(
            cars=all_cars,
            site_url=SITE_URL,
            now=datetime.now().strftime("%Y-%m-%d")
        )
        with open(os.path.join(OUTPUT_DIR, "sitemap.xml"), "w", encoding="utf-8") as f:
            f.write(sitemap_xml)
        print("Generated sitemap.xml")
    except jinja2.TemplateError as e:
        print(f"Error generating sitemap.xml: {e}")


    print("\nBuild complete. The static site is in the 'dist' directory.")

if __name__ == "__main__":
    main()