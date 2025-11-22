"""
Script para scrapear datos de LinkedIn de un usuario.
Extrae: descripción, bio, experiencia y últimos 2 posts.
"""

import os
import json
import time
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
from typing import Dict, List, Optional

def scrape_linkedin_profile(linkedin_url: str, email: str = None, password: str = None) -> Dict:
    """
    Scrapea el perfil de LinkedIn de un usuario.
    
    Args:
        linkedin_url: URL del perfil de LinkedIn (ej: https://www.linkedin.com/in/username/)
        email: Email de LinkedIn (opcional, si no se proporciona usa variables de entorno)
        password: Password de LinkedIn (opcional, si no se proporciona usa variables de entorno)
    
    Returns:
        Dict con los datos scrapeados: description, bio, experience, posts
    """
    
    # Obtener credenciales de variables de entorno si no se proporcionan
    linkedin_email = email or os.environ.get("LINKEDIN_EMAIL")
    linkedin_password = password or os.environ.get("LINKEDIN_PASSWORD")
    
    if not linkedin_email or not linkedin_password:
        print("⚠️  Advertencia: No se proporcionaron credenciales de LinkedIn.")
        print("   El script intentará acceder sin login (puede fallar si el perfil es privado).")
        print("   Configura LINKEDIN_EMAIL y LINKEDIN_PASSWORD como variables de entorno.")
    
    result = {
        "description": "",
        "bio": "",
        "experience": [],
        "posts": []
    }
    
    with sync_playwright() as p:
        # Iniciar navegador (headless=False para ver el proceso)
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        try:
            # Si tenemos credenciales, hacer login
            if linkedin_email and linkedin_password:
                print("🔐 Iniciando sesión en LinkedIn...")
                page.goto("https://www.linkedin.com/login")
                time.sleep(2)
                
                # Ingresar email
                page.fill('input[name="session_key"]', linkedin_email)
                time.sleep(1)
                
                # Ingresar password
                page.fill('input[name="session_password"]', linkedin_password)
                time.sleep(1)
                
                # Click en login
                page.click('button[type="submit"]')
                time.sleep(5)
                
                # Verificar si hay captcha o verificación adicional
                if "challenge" in page.url or "checkpoint" in page.url:
                    print("⚠️  LinkedIn requiere verificación adicional. Por favor completa el captcha manualmente.")
                    print("   Esperando 30 segundos...")
                    time.sleep(30)
            
            # Navegar al perfil
            print(f"📄 Accediendo al perfil: {linkedin_url}")
            page.goto(linkedin_url, wait_until="networkidle")
            time.sleep(3)
            
            # Scroll para cargar contenido dinámico
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(2)
            page.evaluate("window.scrollTo(0, 0)")
            time.sleep(2)
            
            # 1. Extraer descripción (headline)
            print("📝 Extrayendo descripción...")
            try:
                description_selectors = [
                    '.text-heading-xlarge',
                    '.pv-text-details__left-panel h1',
                    '.ph5 h1',
                    'h1.text-heading-xlarge'
                ]
                for selector in description_selectors:
                    try:
                        desc_element = page.query_selector(selector)
                        if desc_element:
                            result["description"] = desc_element.inner_text().strip()
                            break
                    except:
                        continue
            except Exception as e:
                print(f"   ⚠️  Error extrayendo descripción: {e}")
            
            # 2. Extraer bio/about
            print("📖 Extrayendo bio...")
            try:
                # Buscar sección "About"
                about_selectors = [
                    '#about ~ .pvs-list__outer-container',
                    '.pvs-list__outer-container:has-text("About")',
                    'section:has-text("About") .display-flex',
                    '#about + .pvs-list__outer-container'
                ]
                
                # Intentar hacer click en "Show more" si existe
                try:
                    show_more_btn = page.query_selector('button:has-text("Show more"), button:has-text("ver más")')
                    if show_more_btn:
                        show_more_btn.click()
                        time.sleep(1)
                except:
                    pass
                
                # Buscar el texto de About
                about_text = page.evaluate("""
                    () => {
                        const aboutSection = Array.from(document.querySelectorAll('section')).find(
                            section => section.textContent.includes('About')
                        );
                        if (aboutSection) {
                            const textElement = aboutSection.querySelector('.inline-show-more-text, .pv-shared-text-with-see-more, .t-14');
                            return textElement ? textElement.innerText.trim() : '';
                        }
                        return '';
                    }
                """)
                
                if about_text:
                    result["bio"] = about_text
                else:
                    # Fallback: buscar cualquier texto largo en la sección about
                    bio_elements = page.query_selector_all('.pv-about-section .pv-about__summary-text, .about-section .inline-show-more-text')
                    if bio_elements:
                        result["bio"] = bio_elements[0].inner_text().strip()
                        
            except Exception as e:
                print(f"   ⚠️  Error extrayendo bio: {e}")
            
            # 3. Extraer experiencia
            print("💼 Extrayendo experiencia...")
            try:
                # Buscar sección de experiencia
                experience_section = page.evaluate("""
                    () => {
                        const sections = Array.from(document.querySelectorAll('section'));
                        const expSection = sections.find(section => 
                            section.textContent.includes('Experience') || 
                            section.textContent.includes('Experiencia')
                        );
                        return expSection ? expSection.innerHTML : '';
                    }
                """)
                
                # Extraer trabajos
                jobs = page.evaluate("""
                    () => {
                        const jobs = [];
                        const expSection = Array.from(document.querySelectorAll('section')).find(section => 
                            section.textContent.includes('Experience') || 
                            section.textContent.includes('Experiencia')
                        );
                        
                        if (expSection) {
                            const jobElements = expSection.querySelectorAll('.pvs-list__paged-list-item, .pvs-entity');
                            jobElements.forEach((job, index) => {
                                if (index < 10) { // Limitar a 10 trabajos
                                    const title = job.querySelector('.mr1 span[aria-hidden="true"]')?.innerText || 
                                                 job.querySelector('.t-bold span[aria-hidden="true"]')?.innerText || '';
                                    const company = Array.from(job.querySelectorAll('.t-14 span[aria-hidden="true"]'))
                                                         .find(el => el.textContent)?.innerText || '';
                                    const duration = job.querySelector('.t-14.t-normal span[aria-hidden="true"]')?.innerText || '';
                                    const description = job.querySelector('.t-14.t-normal.t-black--light')?.innerText || '';
                                    
                                    if (title) {
                                        jobs.push({
                                            title: title.trim(),
                                            company: company.trim(),
                                            duration: duration.trim(),
                                            description: description.trim()
                                        });
                                    }
                                }
                            });
                        }
                        return jobs;
                    }
                """)
                
                result["experience"] = jobs
                print(f"   ✅ Encontradas {len(jobs)} experiencias")
                
            except Exception as e:
                print(f"   ⚠️  Error extrayendo experiencia: {e}")
            
            # 4. Extraer últimos 2 posts
            print("📱 Extrayendo últimos posts...")
            try:
                # Navegar a la sección de actividad/posts
                # LinkedIn muestra posts en diferentes lugares, intentamos varios
                
                # Scroll para cargar más contenido
                for i in range(3):
                    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    time.sleep(2)
                
                # Extraer posts
                posts = page.evaluate("""
                    () => {
                        const posts = [];
                        // Buscar contenedores de posts
                        const postContainers = document.querySelectorAll(
                            '.feed-shared-update-v2, .update-components-actor, .feed-shared-update-v2__description'
                        );
                        
                        postContainers.forEach((container, index) => {
                            if (index < 2) { // Solo los primeros 2
                                const textElement = container.querySelector(
                                    '.feed-shared-text, .update-components-text, .feed-shared-update-v2__description'
                                );
                                const text = textElement ? textElement.innerText.trim() : '';
                                
                                if (text && text.length > 20) { // Filtrar posts muy cortos
                                    posts.push({
                                        text: text,
                                        index: index + 1
                                    });
                                }
                            }
                        });
                        
                        return posts;
                    }
                """)
                
                # Si no encontramos posts en el perfil, intentar ir a la sección de actividad
                if len(posts) == 0:
                    print("   🔍 Buscando posts en sección de actividad...")
                    activity_url = linkedin_url.rstrip('/') + '/recent-activity/'
                    try:
                        page.goto(activity_url, wait_until="networkidle", timeout=10000)
                        time.sleep(3)
                        
                        posts = page.evaluate("""
                            () => {
                                const posts = [];
                                const postElements = document.querySelectorAll(
                                    '.feed-shared-update-v2, .update-components-actor'
                                );
                                
                                postElements.forEach((element, index) => {
                                    if (index < 2) {
                                        const text = element.querySelector(
                                            '.feed-shared-text, .update-components-text'
                                        )?.innerText.trim() || '';
                                        
                                        if (text && text.length > 20) {
                                            posts.push({
                                                text: text,
                                                index: index + 1
                                            });
                                        }
                                    }
                                });
                                
                                return posts;
                            }
                        """)
                    except:
                        pass
                
                result["posts"] = posts
                print(f"   ✅ Encontrados {len(posts)} posts")
                
            except Exception as e:
                print(f"   ⚠️  Error extrayendo posts: {e}")
            
            browser.close()
            
        except PlaywrightTimeoutError:
            print("⏱️  Timeout esperando que cargue la página")
            browser.close()
        except Exception as e:
            print(f"❌ Error durante el scraping: {e}")
            browser.close()
            raise
    
    return result

def save_results(data: Dict, output_file: str = "linkedin_data.json"):
    """Guarda los resultados en un archivo JSON."""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"💾 Datos guardados en: {output_file}")

def print_results(data: Dict):
    """Imprime los resultados de forma legible."""
    print("\n" + "="*60)
    print("RESULTADOS DEL SCRAPING")
    print("="*60)
    
    print("\n📝 DESCRIPCIÓN:")
    print(data.get("description", "No encontrada"))
    
    print("\n📖 BIO:")
    print(data.get("bio", "No encontrada"))
    
    print("\n💼 EXPERIENCIA:")
    if data.get("experience"):
        for i, exp in enumerate(data["experience"], 1):
            print(f"\n  {i}. {exp.get('title', 'N/A')}")
            print(f"     Empresa: {exp.get('company', 'N/A')}")
            print(f"     Duración: {exp.get('duration', 'N/A')}")
            if exp.get('description'):
                print(f"     Descripción: {exp.get('description', '')[:100]}...")
    else:
        print("  No encontrada")
    
    print("\n📱 POSTS:")
    if data.get("posts"):
        for i, post in enumerate(data["posts"], 1):
            print(f"\n  Post {i}:")
            print(f"  {post.get('text', '')[:200]}...")
    else:
        print("  No encontrados")
    
    print("\n" + "="*60)

def scrape_linkedin_profile_with_browser(page, linkedin_url: str) -> Dict:
    """
    Versión optimizada que usa una página existente del navegador.
    Usar esta función cuando se procesan múltiples usuarios en batch.
    """
    result = {
        "description": "",
        "bio": "",
        "experience": [],
        "posts": []
    }
    
    try:
        # Navegar al perfil
        print(f"📄 Accediendo al perfil: {linkedin_url}")
        page.goto(linkedin_url, wait_until="networkidle", timeout=30000)
        time.sleep(3)
        
        # Scroll para cargar contenido dinámico
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(2)
        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(2)
        
        # 1. Extraer descripción (headline)
        print("📝 Extrayendo descripción...")
        try:
            description_selectors = [
                '.text-heading-xlarge',
                '.pv-text-details__left-panel h1',
                '.ph5 h1',
                'h1.text-heading-xlarge'
            ]
            for selector in description_selectors:
                try:
                    desc_element = page.query_selector(selector)
                    if desc_element:
                        result["description"] = desc_element.inner_text().strip()
                        break
                except:
                    continue
        except Exception as e:
            print(f"   ⚠️  Error extrayendo descripción: {e}")
        
        # 2. Extraer bio/about
        print("📖 Extrayendo bio...")
        try:
            # Intentar hacer click en "Show more" si existe
            try:
                show_more_btn = page.query_selector('button:has-text("Show more"), button:has-text("ver más")')
                if show_more_btn:
                    show_more_btn.click()
                    time.sleep(1)
            except:
                pass
            
            # Buscar el texto de About
            about_text = page.evaluate("""
                () => {
                    const aboutSection = Array.from(document.querySelectorAll('section')).find(
                        section => section.textContent.includes('About')
                    );
                    if (aboutSection) {
                        const textElement = aboutSection.querySelector('.inline-show-more-text, .pv-shared-text-with-see-more, .t-14');
                        return textElement ? textElement.innerText.trim() : '';
                    }
                    return '';
                }
            """)
            
            if about_text:
                result["bio"] = about_text
            else:
                # Fallback: buscar cualquier texto largo en la sección about
                bio_elements = page.query_selector_all('.pv-about-section .pv-about__summary-text, .about-section .inline-show-more-text')
                if bio_elements:
                    result["bio"] = bio_elements[0].inner_text().strip()
                    
        except Exception as e:
            print(f"   ⚠️  Error extrayendo bio: {e}")
        
        # 3. Extraer experiencia
        print("💼 Extrayendo experiencia...")
        try:
            jobs = page.evaluate("""
                () => {
                    const jobs = [];
                    const expSection = Array.from(document.querySelectorAll('section')).find(section => 
                        section.textContent.includes('Experience') || 
                        section.textContent.includes('Experiencia')
                    );
                    
                    if (expSection) {
                        const jobElements = expSection.querySelectorAll('.pvs-list__paged-list-item, .pvs-entity');
                        jobElements.forEach((job, index) => {
                            if (index < 10) {
                                const title = job.querySelector('.mr1 span[aria-hidden="true"]')?.innerText || 
                                             job.querySelector('.t-bold span[aria-hidden="true"]')?.innerText || '';
                                const company = Array.from(job.querySelectorAll('.t-14 span[aria-hidden="true"]'))
                                                 .find(el => el.textContent)?.innerText || '';
                                const duration = job.querySelector('.t-14.t-normal span[aria-hidden="true"]')?.innerText || '';
                                const description = job.querySelector('.t-14.t-normal.t-black--light')?.innerText || '';
                                
                                if (title) {
                                    jobs.push({
                                        title: title.trim(),
                                        company: company.trim(),
                                        duration: duration.trim(),
                                        description: description.trim()
                                    });
                                }
                            }
                        });
                    }
                    return jobs;
                }
            """)
            
            result["experience"] = jobs
            print(f"   ✅ Encontradas {len(jobs)} experiencias")
            
        except Exception as e:
            print(f"   ⚠️  Error extrayendo experiencia: {e}")
        
        # 4. Extraer últimos 2 posts
        print("📱 Extrayendo últimos posts...")
        try:
            # Scroll para cargar más contenido
            for i in range(3):
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                time.sleep(2)
            
            # Extraer posts
            posts = page.evaluate("""
                () => {
                    const posts = [];
                    const postContainers = document.querySelectorAll(
                        '.feed-shared-update-v2, .update-components-actor, .feed-shared-update-v2__description'
                    );
                    
                    postContainers.forEach((container, index) => {
                        if (index < 2) {
                            const textElement = container.querySelector(
                                '.feed-shared-text, .update-components-text, .feed-shared-update-v2__description'
                            );
                            const text = textElement ? textElement.innerText.trim() : '';
                            
                            if (text && text.length > 20) {
                                posts.push({
                                    text: text,
                                    index: index + 1
                                });
                            }
                        }
                    });
                    
                    return posts;
                }
            """)
            
            # Si no encontramos posts en el perfil, intentar ir a la sección de actividad
            if len(posts) == 0:
                print("   🔍 Buscando posts en sección de actividad...")
                activity_url = linkedin_url.rstrip('/') + '/recent-activity/'
                try:
                    page.goto(activity_url, wait_until="networkidle", timeout=10000)
                    time.sleep(3)
                    
                    posts = page.evaluate("""
                        () => {
                            const posts = [];
                            const postElements = document.querySelectorAll(
                                '.feed-shared-update-v2, .update-components-actor'
                            );
                            
                            postElements.forEach((element, index) => {
                                if (index < 2) {
                                    const text = element.querySelector(
                                        '.feed-shared-text, .update-components-text'
                                    )?.innerText.trim() || '';
                                    
                                    if (text && text.length > 20) {
                                        posts.push({
                                            text: text,
                                            index: index + 1
                                        });
                                    }
                                }
                            });
                            
                            return posts;
                        }
                    """)
                except:
                    pass
            
            result["posts"] = posts
            print(f"   ✅ Encontrados {len(posts)} posts")
            
        except Exception as e:
            print(f"   ⚠️  Error extrayendo posts: {e}")
        
    except PlaywrightTimeoutError:
        print("⏱️  Timeout esperando que cargue la página")
        raise
    except Exception as e:
        print(f"❌ Error durante el scraping: {e}")
        raise
    
    return result

def process_batch_from_json(json_file: str, output_dir: str = "linkedin_scraped_data", delay_between_users: int = 5):
    """
    Procesa múltiples usuarios desde un archivo JSON.
    Optimizado para reutilizar el navegador entre usuarios.
    
    Args:
        json_file: Ruta al archivo JSON con usuarios
        output_dir: Directorio donde guardar los resultados
        delay_between_users: Segundos de espera entre cada usuario
    """
    import os
    
    # Crear directorio de salida
    os.makedirs(output_dir, exist_ok=True)
    
    # Leer archivo JSON
    print(f"📂 Leyendo archivo: {json_file}")
    with open(json_file, 'r', encoding='utf-8') as f:
        users = json.load(f)
    
    # Filtrar usuarios con LinkedIn válido
    users_with_linkedin = [
        user for user in users 
        if user.get("linkedin_link") and 
        user["linkedin_link"] not in [None, "", "null"] and
        "linkedin.com" in str(user["linkedin_link"])
    ]
    
    print(f"✅ Encontrados {len(users_with_linkedin)} usuarios con LinkedIn de {len(users)} totales\n")
    
    # Obtener credenciales
    linkedin_email = os.environ.get("LINKEDIN_EMAIL")
    linkedin_password = os.environ.get("LINKEDIN_PASSWORD")
    
    # Resultados consolidados
    all_results = []
    successful = 0
    failed = 0
    
    # Iniciar navegador una sola vez para todos los usuarios
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        # Login una sola vez al inicio
        if linkedin_email and linkedin_password:
            print("🔐 Iniciando sesión en LinkedIn...")
            try:
                page.goto("https://www.linkedin.com/login")
                time.sleep(2)
                
                page.fill('input[name="session_key"]', linkedin_email)
                time.sleep(1)
                
                page.fill('input[name="session_password"]', linkedin_password)
                time.sleep(1)
                
                page.click('button[type="submit"]')
                time.sleep(5)
                
                if "challenge" in page.url or "checkpoint" in page.url:
                    print("⚠️  LinkedIn requiere verificación adicional. Por favor completa el captcha manualmente.")
                    print("   Esperando 30 segundos...")
                    time.sleep(30)
                
                print("✅ Login exitoso\n")
            except Exception as e:
                print(f"⚠️  Error en login: {e}. Continuando sin login...\n")
        
        # Procesar cada usuario
        for idx, user in enumerate(users_with_linkedin, 1):
            username = user.get("username", "unknown")
            linkedin_url = user["linkedin_link"]
            
            print(f"\n{'='*70}")
            print(f"[{idx}/{len(users_with_linkedin)}] Procesando: {username}")
            print(f"LinkedIn: {linkedin_url}")
            print(f"{'='*70}\n")
            
            try:
                # Realizar scraping usando el navegador reutilizado
                data = scrape_linkedin_profile_with_browser(page, linkedin_url)
                
                # Agregar información del usuario
                data["username"] = username
                data["linkedin_url"] = linkedin_url
                data["github_link"] = user.get("github_link")
                
                # Guardar resultado individual
                individual_file = os.path.join(output_dir, f"{username}_linkedin.json")
                save_results(data, individual_file)
                
                # Agregar a resultados consolidados
                all_results.append(data)
                successful += 1
                
                print(f"✅ {username} procesado exitosamente")
                
            except KeyboardInterrupt:
                print("\n⚠️  Proceso interrumpido por el usuario")
                break
            except Exception as e:
                print(f"❌ Error procesando {username}: {e}")
                failed += 1
                
                # Guardar error en resultados
                error_data = {
                    "username": username,
                    "linkedin_url": linkedin_url,
                    "github_link": user.get("github_link"),
                    "error": str(e),
                    "description": "",
                    "bio": "",
                    "experience": [],
                    "posts": []
                }
                all_results.append(error_data)
            
            # Esperar entre usuarios (excepto el último)
            if idx < len(users_with_linkedin):
                print(f"\n⏳ Esperando {delay_between_users} segundos antes del siguiente usuario...\n")
                time.sleep(delay_between_users)
        
        browser.close()
    
    # Guardar resultados consolidados
    consolidated_file = os.path.join(output_dir, "all_linkedin_data.json")
    with open(consolidated_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    # Resumen final
    print(f"\n{'='*70}")
    print("RESUMEN FINAL")
    print(f"{'='*70}")
    print(f"✅ Exitosos: {successful}")
    print(f"❌ Fallidos: {failed}")
    print(f"📊 Total procesados: {len(users_with_linkedin)}")
    print(f"💾 Resultados guardados en: {output_dir}/")
    print(f"📄 Archivo consolidado: {consolidated_file}")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    import sys
    
    # Verificar si se proporciona un archivo JSON
    if len(sys.argv) > 1 and sys.argv[1].endswith('.json'):
        json_file = sys.argv[1]
        output_dir = sys.argv[2] if len(sys.argv) > 2 else "linkedin_scraped_data"
        
        print(f"\n🚀 Modo batch: Procesando usuarios desde {json_file}\n")
        process_batch_from_json(json_file, output_dir)
    
    else:
        # Modo individual: procesar un solo usuario
        if len(sys.argv) > 1:
            linkedin_url = sys.argv[1]
        else:
            linkedin_url = input("Ingresa la URL del perfil de LinkedIn: ").strip()
        
        if not linkedin_url:
            print("❌ Error: Debes proporcionar una URL de LinkedIn")
            sys.exit(1)
        
        # Validar formato de URL
        if not linkedin_url.startswith("http"):
            linkedin_url = "https://www.linkedin.com/in/" + linkedin_url.lstrip("/")
        
        print(f"\n🚀 Iniciando scraping de: {linkedin_url}\n")
        
        # Realizar scraping
        try:
            data = scrape_linkedin_profile(linkedin_url)
            
            # Agregar URL al resultado
            data["linkedin_url"] = linkedin_url
            
            # Mostrar resultados
            print_results(data)
            
            # Guardar resultados
            save_results(data)
            
        except KeyboardInterrupt:
            print("\n⚠️  Proceso interrumpido por el usuario")
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()

