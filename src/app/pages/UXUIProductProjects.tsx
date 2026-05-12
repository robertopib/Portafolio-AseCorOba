import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useLanguage } from "../context/LanguageContext";
import uxuiSketch from "figma:asset/9d530dfc692ba53ddba3038fa3d2ae6c29d1bcad.png";

export function UXUIProductProjects() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6 md:px-12 lg:px-24 relative overflow-hidden">
      {/* Abstract gradient background shapes */}
      <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-300/08 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-rose-300/08 to-transparent rounded-full blur-3xl"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-pink-300 hover:text-fuchsia-300 transition-colors mb-8 group"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-semibold">{language === 'es' ? 'Volver al inicio' : 'Back to home'}</span>
          </Link>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-100 mb-6 uppercase">
            {language === 'es' ? 'UX/UI Producto' : 'UX/UI Product'}
          </h1>
          <p className="text-xl md:text-2xl text-pink-300 mb-6 italic font-semibold">
            {language === 'es' ? 'Quiero… ¡Encontrar soluciones!' : 'I want to… Find solutions!'}
          </p>
        </div>

        {/* Snaga Project - Hero Image */}
        <div className="mb-16">
          <div className="relative bg-neutral-800 rounded-[3px] overflow-hidden shadow-sm">
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-100 to-neutral-100" style={{ height: '400px' }}>
              <ImageWithFallback
                src={uxuiSketch}
                alt="Snaga - UX/UI Case Study"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Project Title */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-4xl tracking-tight text-neutral-100 mb-4">
            Snaga
          </h2>
          <p className="text-lg md:text-xl text-pink-300 mb-8">
            Centro de Entrenamiento Físico · Costa Rica
          </p>
          
          {/* Project Overview - New Content */}
          <div className="space-y-4">
            <p className="text-base text-neutral-100">
              <strong>Proyecto:</strong> Creación completa de branding, sitio web y estrategia de contenido digital para centro de entrenamiento físico
            </p>
            <p className="text-base text-neutral-100">
              <strong>Mi Rol:</strong> UX/UI Designer, Creadora de Contenido Digital, Stakeholder Facilitator
            </p>
            <p className="text-base text-neutral-100">
              <strong>Contribución:</strong> Lideré el proceso de investigación de usuarios (entrevistas, user personas, journey mapping), diseñé wireframes y prototipos, y creé el sistema de diseño completo. Aumenté las tasas de conversión simplificando el flujo de contacto basado en insights de usuarios.
            </p>
          </div>
        </div>

        {/* Introducción */}
        <section className="mb-16">
          <p className="text-base text-neutral-100 leading-relaxed mb-6">
            Snaga es un centro de entrenamiento físico en Costa Rica, un cliente real. Snaga en sí es el producto que se trabajó, inicio creando su línea gráfica, así como crear su sitio web y concluyendo con creación de contenido para redes sociales y marketing.
          </p>
          <p className="text-base text-neutral-100 leading-relaxed mb-6">
            Su primera necesidad era dar a conocer su metodología de entrenamiento, a personas que estuvieran interesadas en un cambio de estilo de vida o mantener uno saludable.
          </p>
          <p className="text-base text-neutral-100 leading-relaxed mb-6">
            Generando así confianza a su público para que estos llegarán a consumir el producto. No obstante se debía de mantener interesadas a las personas que ya consumían dicho producto, asegurando así su fidelidad.
          </p>
        </section>

        {/* Problema y Solución */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Problema */}
            <div>
              <div className="mb-6">
                <div className="inline-block px-4 py-2 bg-pink-900/20 text-pink-300 rounded-[3px] text-sm tracking-widest uppercase mb-4">
                  Problema
                </div>
              </div>
              <p className="text-base text-neutral-100 leading-relaxed">
                Los usuarios tienen poco o ningún conocimiento del centro de entrenamiento y su metodología.
              </p>
            </div>

            {/* Solución */}
            <div>
              <div className="mb-6">
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-pink-300 to-rose-300 hover:from-fuchsia-500 hover:to-orange-500 text-neutral-100 rounded-[3px] text-sm tracking-widest uppercase mb-4">
                  Solución
                </div>
              </div>
              <p className="text-base text-neutral-100 leading-relaxed">
                Crear un branding que represente los valores del producto, un sitio web y contenido de valor, para dar a conocer a detalle todo sobre el producto.
              </p>
            </div>
          </div>
        </section>

        {/* Detalles del Proyecto */}
        <section className="mb-16">
          <div className="bg-neutral-900 rounded-[3px] overflow-hidden border border-neutral-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-8 py-4 text-base text-pink-300 font-semibold bg-neutral-900/50">
                    Herramientas
                  </th>
                  <th className="text-left px-8 py-4 text-base text-pink-300 font-semibold bg-neutral-900/50">
                    Equipo
                  </th>
                  <th className="text-left px-8 py-4 text-base text-pink-300 font-semibold bg-neutral-900/50">
                    Mi Rol
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-800">
                  <td className="px-8 py-4 text-base text-neutral-100 align-top">Miro</td>
                  <td className="px-8 py-4 text-base text-neutral-100 align-top">2 UX/UI designers</td>
                  <td className="px-8 py-4 text-base text-neutral-100 align-top">UX/UI designer</td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="px-8 py-4 text-base text-neutral-100 align-top">Figma</td>
                  <td className="px-8 py-4 text-base text-neutral-100 align-top">1 developer</td>
                  <td className="px-8 py-4 text-base text-neutral-100 align-top">Creadora de contenido</td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="px-8 py-4 text-base text-neutral-100 align-top">Adobe</td>
                  <td className="px-8 py-4 text-base text-neutral-100 align-top"></td>
                  <td className="px-8 py-4 text-base text-neutral-100 align-top">Diseño digital</td>
                </tr>
                <tr>
                  <td className="px-8 py-4 text-base text-neutral-100 align-top"></td>
                  <td className="px-8 py-4 text-base text-neutral-100 align-top"></td>
                  <td className="px-8 py-4 text-base text-neutral-100 align-top">Stakeholder facilitador</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-16">
          <h3 className="text-xl md:text-2xl tracking-tight text-neutral-100 mb-8">
            Línea de Tiempo
          </h3>
          <div className="bg-neutral-900 rounded-[3px] p-8">
            <p className="text-base text-pink-300 mb-6">
              <strong>Duración total:</strong> 2 meses y 15 días
            </p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <span className="text-base text-neutral-100 min-w-[200px]">Descubrimiento y búsqueda</span>
                <span className="text-base text-neutral-400">1 semana</span>
              </div>
              <div className="flex gap-4">
                <span className="text-base text-neutral-100 min-w-[200px]">Creación de branding</span>
                <span className="text-base text-neutral-400">2 semanas</span>
              </div>
              <div className="flex gap-4">
                <span className="text-base text-neutral-100 min-w-[200px]">Desarrollo sitio web</span>
                <span className="text-base text-neutral-400">3 semanas</span>
              </div>
              <div className="flex gap-4">
                <span className="text-base text-neutral-100 min-w-[200px]">Testing</span>
                <span className="text-base text-neutral-400">2 semanas</span>
              </div>
              <div className="flex gap-4">
                <span className="text-base text-neutral-100 min-w-[200px]">Creación de contenido digital</span>
                <span className="text-base text-neutral-400">2 semanas</span>
              </div>
            </div>
          </div>
        </section>

        {/* User Journey Map */}
        <section className="mb-16">
          <h3 className="text-xl md:text-2xl tracking-tight text-neutral-100 mb-8">
            User Journey Map
          </h3>
          <p className="text-base text-neutral-100 leading-relaxed mb-8">
            Con el objetivo claro, nos aseguramos de que nuestros usuarios tengan toda la información necesaria para llegar a contactar con el equipo de marketing.
          </p>
          <p className="text-base text-neutral-100 leading-relaxed mb-8">
            Dibujamos un mapa de viaje del usuario del estado actual para identificar qué información es la que más le interesa conocer y así vemos la oportunidad de mejora.
          </p>
          <p className="text-base text-neutral-100 leading-relaxed mb-12">
            Terminamos con una experiencia de solicitar información más rápida y sencilla, generando de esta forma tasas de conversión mayores.
          </p>

          {/* Visual Journey Map */}
          <div className="mb-12">
            <div className="relative">
              {/* Journey Timeline */}
              <div className="grid grid-cols-5 gap-4 mb-8">
                {/* Stage 1: Discovery */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 border border-purple-400/20 rounded-[3px] p-6 h-full">
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-300 flex items-center justify-center text-neutral-100 font-bold mb-4">
                        1
                      </div>
                      <h4 className="text-base text-purple-300 font-semibold uppercase tracking-wide mb-4">
                        Discovery
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Acción</p>
                        <p className="text-sm text-neutral-100">Encuentra el sitio web a través de búsqueda o redes sociales</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Pensamiento</p>
                        <p className="text-sm text-neutral-300 italic">"¿Este servicio es lo que necesito?"</p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-500 uppercase tracking-wider mb-1">Fricción</p>
                        <p className="text-sm text-rose-300">Primera impresión poco clara</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 2: Exploration */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-pink-300/08 to-pink-600/20 border border-pink-300/20 rounded-[3px] p-6 h-full">
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-300 to-pink-200 flex items-center justify-center text-neutral-100 font-bold mb-4">
                        2
                      </div>
                      <h4 className="text-base text-pink-300 font-semibold uppercase tracking-wide mb-4">
                        Exploration
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Acción</p>
                        <p className="text-sm text-neutral-100">Navega el sitio para entender los servicios</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Pensamiento</p>
                        <p className="text-sm text-neutral-300 italic">"¿Qué ofrecen exactamente?"</p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-500 uppercase tracking-wider mb-1">Fricción</p>
                        <p className="text-sm text-rose-300">Demasiada información</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 3: Evaluation */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-pink-600/20 to-orange-600/20 border border-pink-300/20 rounded-[3px] p-6 h-full">
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-300 to-rose-300 flex items-center justify-center text-neutral-100 font-bold mb-4">
                        3
                      </div>
                      <h4 className="text-base text-pink-300 font-semibold uppercase tracking-wide mb-4">
                        Evaluation
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Acción</p>
                        <p className="text-sm text-neutral-100">Revisa portafolio, casos y credibilidad</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Pensamiento</p>
                        <p className="text-sm text-neutral-300 italic">"¿Tienen experiencia en mi industria?"</p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-500 uppercase tracking-wider mb-1">Fricción</p>
                        <p className="text-sm text-rose-300">Casos sin suficiente detalle</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 4: Decision */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-rose-300/08 to-amber-600/20 border border-rose-300/20 rounded-[3px] p-6 h-full">
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-300 to-amber-300 flex items-center justify-center text-neutral-100 font-bold mb-4">
                        4
                      </div>
                      <h4 className="text-base text-rose-300 font-semibold uppercase tracking-wide mb-4">
                        Decision
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Acción</p>
                        <p className="text-sm text-neutral-100">Decide si el servicio se ajusta a sus necesidades</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Pensamiento</p>
                        <p className="text-sm text-neutral-300 italic">"Quiero saber precios y disponibilidad"</p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-500 uppercase tracking-wider mb-1">Fricción</p>
                        <p className="text-sm text-rose-300">Falta info de tarifas</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 5: Contact */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-amber-600/20 to-green-600/20 border border-amber-300/20 rounded-[3px] p-6 h-full">
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-green-400 flex items-center justify-center text-neutral-100 font-bold mb-4">
                        5
                      </div>
                      <h4 className="text-base text-amber-300 font-semibold uppercase tracking-wide mb-4">
                        Contact
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Acción</p>
                        <p className="text-sm text-neutral-100">Llena un formulario o se contacta</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Pensamiento</p>
                        <p className="text-sm text-neutral-300 italic">"Espero una respuesta rápida"</p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-500 uppercase tracking-wider mb-1">Fricción</p>
                        <p className="text-sm text-rose-300">Formulario largo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection Line */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 via-pink-600 via-orange-600 to-amber-600 opacity-30" style={{ top: '24px' }}></div>
            </div>
          </div>

          {/* Questions & Answers */}
          <div className="space-y-8">
            <div>
              <h4 className="text-base text-pink-300 mb-3">
                ¿Cómo y por qué eligimos qué camino mapear?
              </h4>
              <p className="text-base text-neutral-100 leading-relaxed">
                Basándonos en las necesidades e inquietudes del usuario.
              </p>
            </div>

            <div>
              <h4 className="text-base text-pink-300 mb-3">
                ¿Cómo probamos y validamos el mapa?
              </h4>
              <p className="text-base text-neutral-100 leading-relaxed">
                Una vez que conocimos las necesidades del usuario y teníamos las ideas claras, procedimos a realizar encuestas con dicha información para saber si el mapa era coherente, fácil e intuitivo.
              </p>
            </div>

            <div>
              <h4 className="text-base text-pink-300 mb-3">
                ¿Qué nos reveló el mapeo del viaje?
              </h4>
              <p className="text-base text-neutral-100 leading-relaxed">
                Reveló que hay puntos que si bien es cierto le interesan al usuario, no son el punto más fuerte. Nos dimos cuenta que básicamente el usuario de este producto literal prefiere empezar por el final, saber datos que no se entregan al inicio.
              </p>
            </div>

            <div>
              <h4 className="text-base text-pink-300 mb-3">
                ¿Cuáles fueron los principales puntos débiles del usuario?
              </h4>
              <ul className="space-y-2 list-disc list-inside text-base text-neutral-100 leading-relaxed">
                <li>Al usuario no le interesa leer de más, por lo que hay que darle poco contenido pero de calidad.</li>
                <li>El usuario no puede inscribirse a través de la web.</li>
                <li>El tiempo de respuesta en la vía de comunicación podría ser una debilidad.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-base text-pink-300 mb-3">
                ¿Qué cambiamos en el diseño debido al mapeo del recorrido del usuario?
              </h4>
              <p className="text-base text-neutral-100 leading-relaxed">
                Cambiamos contenidos, cantidad de información, cambiamos el orden de la entrega de información y la forma en que hacen el primer contacto.
              </p>
            </div>
          </div>
        </section>

        {/* User Personas */}
        <section className="mb-16">
          <h3 className="text-xl md:text-2xl tracking-tight text-neutral-100 mb-8">
            User Personas
          </h3>
          <p className="text-base text-neutral-100 leading-relaxed mb-8">
            Para lograr comprender de manera más exacta los objetivos, necesidades, experiencias y comportamientos de nuestros usuarios, creamos personas (usuarios).
          </p>
          <p className="text-base text-neutral-100 leading-relaxed mb-12">
            Nos basamos en recopilación y el análisis de datos sobre los usuarios reales, incluidas sus características demográficas, comportamientos, necesidades y metas.
          </p>

          {/* Preguntas sobre User Personas */}
          <div className="space-y-6 mb-12">
            <div>
              <h4 className="text-base text-pink-300 mb-3">
                ¿Por qué necesitábamos user personas?
              </h4>
              <p className="text-base text-neutral-100 leading-relaxed">
                Queríamos entender las necesidades del usuario y conocer la manera en que ven y asimilan el producto.
              </p>
            </div>

            <div>
              <h4 className="text-base text-pink-300 mb-3">
                ¿Qué datos utilizamos para construir estas personas?
              </h4>
              <p className="text-base text-neutral-100 leading-relaxed">
                Se utilizaron datos demográficos, sexo, edad, educación, ingresos, también sus intereses, gustos entre otros.
              </p>
            </div>

            <div>
              <h4 className="text-base text-pink-300 mb-3">
                ¿Cómo nos influyeron los personajes al proceso de diseño?
              </h4>
              <p className="text-base text-neutral-100 leading-relaxed">
                Lo hicieron a la hora de proporcionar información detallada y centrada en el usuario, ayudando a comprender mejor las necesidades, preferencias y comportamientos. Lo que da como resultado soluciones de diseño más efectivas y orientadas al usuario.
              </p>
            </div>

            <div>
              <h4 className="text-base text-pink-300 mb-3">
                ¿Durante qué etapa del proceso de diseño reflexionamos sobre las personas?
              </h4>
              <p className="text-base text-neutral-100 leading-relaxed mb-4">
                En la investigación y comprensión del usuario. Siguiendo en la ideación y conceptualización, luego en el UX/UI estructura de la información, la arquitectura de la navegación, la disposición de los elementos de la interfaz, la usabilidad y la accesibilidad. Después en la evaluación y pruebas de usabilidad.
              </p>
              <p className="text-base text-neutral-100 leading-relaxed">
                En resumen los user personas son indispensables en todas las etapas ya que nos asegura que el diseño está centrado en el usuario y satisfaga las necesidades y objetivos de los mismos.
              </p>
            </div>
          </div>

          {/* Persona Cards */}
          <div className="space-y-8">
            {/* Persona 1: Adolfo Sanchez */}
            <div className="bg-neutral-900 rounded-[3px] p-8">
              <div className="mb-6">
                <h4 className="text-lg text-neutral-100 mb-2">Adolfo Sanchez</h4>
                <p className="text-base text-neutral-400 mb-2">No físicamente activo</p>
                <p className="text-base text-pink-300 italic">"Te ayudaremos a darle un giro a tu vida"</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <div>
                  <h5 className="text-base text-neutral-100 mb-3">Información básica</h5>
                  <ul className="space-y-1 text-base text-neutral-400">
                    <li>• Hombre</li>
                    <li>• 35 años de edad</li>
                    <li>• Trabaja en P&G</li>
                    <li>• Locación: Escazú</li>
                    <li>• Estatus económico: Medio, medio-alto</li>
                  </ul>
                </div>

                <div>
                  <h5 className="text-base text-neutral-100 mb-3">Canales</h5>
                  <ul className="space-y-1 text-base text-neutral-400">
                    <li>• Instagram</li>
                    <li>• Facebook</li>
                    <li>• Website</li>
                    <li>• Mailchimp</li>
                    <li>• Whatsapp campaigns</li>
                    <li>• Convenios con empresa</li>
                  </ul>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h5 className="text-base text-neutral-100 mb-3">Motivaciones</h5>
                  <ul className="space-y-1 text-base text-neutral-400">
                    <li>• Mejorar salud</li>
                    <li>• Mejor físico</li>
                    <li>• Conocer personas</li>
                  </ul>
                </div>

                <div>
                  <h5 className="text-base text-neutral-100 mb-3">Pain points</h5>
                  <ul className="space-y-1 text-base text-neutral-400">
                    <li>• El gimnasio convencional me aburre</li>
                    <li>• Las sesiones de entrenamiento son largas</li>
                    <li>• Entrenar solo</li>
                    <li>• No entender los programas de entrenamiento</li>
                    <li>• Programas de entrenamiento sin enfoque</li>
                    <li>• Pocos horarios</li>
                    <li>• Lesiones</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Persona 2: Eva Rodríguez */}
            <div className="bg-neutral-900 rounded-[3px] p-8">
              <div className="mb-6">
                <h4 className="text-lg text-neutral-100 mb-2">Eva Rodríguez</h4>
                <p className="text-base text-neutral-400 mb-2">Físicamente activa</p>
                <p className="text-base text-pink-300 italic">"Te ayudaremos a mantener tu estilo de vida saludable"</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <div>
                  <h5 className="text-base text-neutral-100 mb-3">Información básica</h5>
                  <ul className="space-y-1 text-base text-neutral-400">
                    <li>• Mujer</li>
                    <li>• 43 años de edad</li>
                    <li>• Coach de nutrición</li>
                    <li>• Locación: Santa Ana</li>
                    <li>• Estatus económico: Medio, medio-alto</li>
                  </ul>
                </div>

                <div>
                  <h5 className="text-base text-neutral-100 mb-3">Canales</h5>
                  <ul className="space-y-1 text-base text-neutral-400">
                    <li>• Instagram</li>
                    <li>• Facebook</li>
                    <li>• Website</li>
                    <li>• Mailchimp</li>
                    <li>• Whatsapp campaigns</li>
                    <li>• Boca en boca</li>
                    <li>• Convenios con empresa</li>
                  </ul>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h5 className="text-base text-neutral-100 mb-3">Motivaciones</h5>
                  <ul className="space-y-1 text-base text-neutral-400">
                    <li>• Continuar con una salud óptima</li>
                    <li>• Mejorar físico, enfocado en ganar masa muscular o pérdida de grasa</li>
                    <li>• Pertenecer a una comunidad</li>
                    <li>• Conocer nuevos ejercicios</li>
                    <li>• Preparación específica para competir en alguna disciplina</li>
                  </ul>
                </div>

                <div>
                  <h5 className="text-base text-neutral-100 mb-3">Pain points</h5>
                  <ul className="space-y-1 text-base text-neutral-400">
                    <li>• No ver resultados</li>
                    <li>• No tener programación específica</li>
                    <li>• El gimnasio convencional me aburre</li>
                    <li>• Entrenar solo</li>
                    <li>• No entender los programas de entrenamiento</li>
                    <li>• Pocos horarios</li>
                    <li>• Lesiones</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Persona 3: Mario López */}
            <div className="bg-neutral-900 rounded-[3px] p-8">
              <div className="mb-6">
                <h4 className="text-lg text-neutral-100 mb-2">Mario López</h4>
                <p className="text-base text-neutral-400 mb-2">Practicante de CrossFit</p>
                <p className="text-base text-pink-300 italic">"Somos el mejor centro de entrenamiento, ven y prueba"</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <div>
                  <h5 className="text-base text-neutral-100 mb-3">Información básica</h5>
                  <ul className="space-y-1 text-base text-neutral-400">
                    <li>• Hombre</li>
                    <li>• 23 años de edad</li>
                    <li>• Estudia fisioterapia</li>
                    <li>• Locación: Escazú</li>
                    <li>• Estatus económico: Medio, medio-alto</li>
                  </ul>
                </div>

                <div>
                  <h5 className="text-base text-neutral-100 mb-3">Canales</h5>
                  <ul className="space-y-1 text-base text-neutral-400">
                    <li>• Instagram</li>
                    <li>• Facebook</li>
                    <li>• Website</li>
                    <li>• Mailchimp</li>
                    <li>• Whatsapp campaigns</li>
                    <li>• Boca en boca</li>
                  </ul>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h5 className="text-base text-neutral-100 mb-3">Motivaciones</h5>
                  <ul className="space-y-1 text-base text-neutral-400">
                    <li>• Continuar entrenando crossfit</li>
                    <li>• Continuar con una salud óptima</li>
                    <li>• Mantener su estado físico</li>
                    <li>• Pertenecer a una comunidad</li>
                    <li>• Mejorar algunos ejercicios/movimientos</li>
                    <li>• Competir en esta disciplina</li>
                    <li>• Programación nueva y mejor</li>
                    <li>• Diferencia de tarifas</li>
                  </ul>
                </div>

                <div>
                  <h5 className="text-base text-neutral-100 mb-3">Pain points</h5>
                  <ul className="space-y-1 text-base text-neutral-400">
                    <li>• No ver resultados</li>
                    <li>• Tener programación cambiante</li>
                    <li>• Coaches no a la altura</li>
                    <li>• Tarifas altas</li>
                    <li>• Rotación de personas</li>
                    <li>• No tener open box</li>
                    <li>• Mal mantenimiento de las instalaciones y equipo</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bocetos */}
        <section className="mb-16">
          <h3 className="text-xl md:text-2xl tracking-tight text-neutral-100 mb-8">
            Bocetos
          </h3>
          <p className="text-base text-neutral-100 leading-relaxed mb-6">
            Lo primero que se realizó fue el proceso de diseño con bocetos en papel y lápiz, wireframes de baja fidelidad para así agilizar las tomas de decisiones.
          </p>
          <p className="text-base text-neutral-100 leading-relaxed mb-6">
            Los bocetos se basaron en las entrevistas iniciales con los usuarios y el objetivo del cliente. Nos comentaron de manera constante que lo que les interesaba ver al inicio eran las tarifas del producto y que en los primeros bocetos se entrega mucha información que es valiosa pero no para un "enganche rápido".
          </p>
          <p className="text-base text-neutral-100 leading-relaxed mb-12">
            Por lo que volvimos a bocetar, cuidando en el proceso no perder el objetivo e ideas principales.
          </p>

          <div className="space-y-6">
            <div>
              <h4 className="text-base text-pink-300 mb-3">
                ¿Cuál fue el objetivo principal de los bocetos?
              </h4>
              <p className="text-base text-neutral-100 leading-relaxed">
                Tener una idea del flujo que deben tener los usuarios, así como darnos cuenta de errores de una forma temprana para optimizar el tiempo de desarrollo y así evitar pérdida de dinero. No obstante tener una visualización de los espacios a desarrollar.
              </p>
            </div>

            <div>
              <h4 className="text-base text-pink-300 mb-3">
                ¿Qué información fue la base para los bocetos?
              </h4>
              <p className="text-base text-neutral-100 leading-relaxed">
                La información fue la recopilada de las entrevistas, y de la comunicación con los key stakeholders.
              </p>
            </div>
          </div>
        </section>

        {/* Aprendizajes */}
        <section className="mb-16">
          <h3 className="text-xl md:text-2xl tracking-tight text-neutral-100 mb-8">
            Aprendizajes
          </h3>

          <div className="space-y-8">
            <div>
              <h4 className="text-base text-pink-300 mb-3">
                ¿Qué nueva habilidad o herramienta aprendí a lo largo del proyecto?
              </h4>
              <p className="text-base text-neutral-100 leading-relaxed mb-4">
                La parte de research es una herramienta que en alguna ocasión la subestimamos por el hecho de creer conocer muy bien el producto que estamos trabajando o al escuchar a los product owner hablar claro del tema y pensar muy erróneamente que con solo eso ya tenemos claro los pains o soluciones.
              </p>
              <p className="text-base text-neutral-100 leading-relaxed">
                Tanto el research como el testing son herramientas muy importantes, en este proyecto aprendí a valorarlas aún más y fueron de mucha ayuda.
              </p>
            </div>

            <div>
              <h4 className="text-base text-pink-300 mb-3">
                Prácticas de diseño que utilicé por primera vez
              </h4>
              <p className="text-base text-neutral-100 leading-relaxed">
                Las entrevistas, las utilicé por primera vez y creo que no hay vuelta atrás después de eso. La información que proporcionan es realmente valiosa.
              </p>
            </div>

            <div>
              <h4 className="text-base text-pink-300 mb-3">
                ¿Cómo contribuyó este proyecto a mi crecimiento como diseñadora?
              </h4>
              <p className="text-base text-neutral-100 leading-relaxed">
                Creo que con cada proyecto uno crece, ya que siempre hay nuevos aprendizajes, nuevas técnicas que poner en marcha, definitivamente aprendes a leer mejor los datos y conectar más con el user, y así crear un mejor producto.
              </p>
            </div>

            <div>
              <h4 className="text-base text-pink-300 mb-3">
                ¿Qué aprendí a lo largo de este proyecto que influye en la forma de diseñar?
              </h4>
              <p className="text-base text-neutral-100 leading-relaxed">
                Definitivamente, la necesidad de conocer más datos del user. Ya no solo pienso en el diseño para que se vea bonito, ahora pienso en diseño inteligente, con una usabilidad práctica.
              </p>
            </div>
          </div>
        </section>

        {/* Back to Home Button */}
        <div className="flex justify-center mt-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-300 to-rose-300 hover:from-fuchsia-500 hover:to-orange-500 hover:bg-violet-700 text-neutral-100 rounded-[3px] transition-all duration-300 group"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span>{language === 'es' ? 'Volver al inicio' : 'Back to home'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}