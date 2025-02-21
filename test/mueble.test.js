const request = require("supertest");
const app = require("../index");

describe("Endpoints de Mueble", () => {
  let idMuebleCreado;

  test("GET /api/mueble → Obtener lista de muebles", async () => {
    const res = await request(app).get("/api/mueble");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.datos)).toBe(true);
  });

  test("POST /api/mueble → Crear un nuevo mueble con componentes", async () => {
    const nuevoMueble = {
      mueble: {
        nombre: "Mesa de prueba",
        precio_base: 250.0,
        fecha_entrega: "2021-12-31",
        requiere_montar: true,
      },
      componentes: [
        { id_componente: 22, cantidad: 2 },
        { id_componente: 23, cantidad: 1 },
      ],
    };

    const res = await request(app)
      .post("/api/mueble")
      .send(nuevoMueble)
      .set("Accept", "application/json");

    idMuebleCreado = res.body.datos.id_mueble;

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("datos");
    expect(res.body.mensaje).toBe("Mueble creado correctamente");
    expect(res.body.datos).toHaveProperty("id_mueble");
    expect(res.body.datos.nombre).toBe(nuevoMueble.mueble.nombre);
    expect(res.body.datos.precio).toBe(nuevoMueble.mueble.precio);
  });

  test("GET /api/mueble/:id_mueble → Obtener un mueble existente", async () => {
    const res = await request(app).get(`/api/mueble/${idMuebleCreado}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("datos");
    expect(res.body.mensaje).toBe("Mueble recuperado");
    expect(res.body.datos.id_mueble).toBe(idMuebleCreado);
    expect(res.body.datos.nombre).toBe("Mesa de prueba");
  });

  test("GET /api/mueble/buscar?nombre=madera → Obtener muebles que contienen 'madera'", async () => {
    const res = await request(app).get("/api/mueble/buscar?nombre=madera");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("nombre");
    expect(res.body.some((mueble) => mueble.nombre.includes("madera"))).toBe(
      true
    );
  });

  test("GET /api/mueble/fechaentrega/2025-03-01 → Obtener muebles con entrega antes de 2025-03-01", async () => {
    const res = await request(app).get("/api/mueble/fechaentrega/2025-03-01");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(
      res.body.every(
        (mueble) => new Date(mueble.fecha_entrega) <= new Date("2025-03-01")
      )
    ).toBe(true);
  });

  test("PUT /api/mueble/:id_mueble → Actualizar un mueble existente", async () => {
    const res = await request(app)
      .put(`/api/mueble/${idMuebleCreado}`)
      .send({
        mueble: {
          nombre: "Mesa de prueba",
          precio_base: 50,
          fecha_entrega: "2021-12-31",
          requiere_montar: true,
        },
        componentes: [
          { id_componente: 22, cantidad: 5 }, // Actualizar cantidad
          { id_componente: 23, cantidad: 0 }, // Eliminar componente
        ],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toBe("Mueble actualizado correctamente");
    expect(res.body.datos.precio_base).toBe(50);
  });

  test("DELETE /api/mueble/:id_mueble → Eliminar un mueble existente", async () => {
    const res = await request(app).delete(`/api/mueble/${idMuebleCreado}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toBe("Mueble eliminado");
  });

  test("DELETE /api/mueble/:id_mueble → Intentar eliminar un mueble inexistente", async () => {
    const res = await request(app).delete("/api/mueble/99999"); // ID que no existe

    expect(res.statusCode).toBe(404);
    expect(res.body.mensaje).toContain("No encontrado");
  });

  test("GET /api/mueble/:id_mueble → Intentar obtener un mueble inexistente", async () => {
    const res = await request(app).get("/api/mueble/99999"); // ID que no existe

    expect(res.statusCode).toBe(404);
    expect(res.body.mensaje).toBe("Mueble no encontrado");
  });

  test("GET /api/mueble/buscar?nombre=inexistente → No encontrar muebles", async () => {
    const res = await request(app).get("/api/mueble/buscar?nombre=inexistente");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe(
      "No se encontraron muebles con el nombre: inexistente"
    );
  });

  test("GET /api/mueble/fechaentrega/2003-01-01 → No encontrar muebles con entrega antes de 2003-01-01", async () => {
    const res = await request(app).get("/api/mueble/fechaentrega/2003-01-01");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe(
      "No hay muebles con entrega antes de 2003-01-01"
    );
  });

  test("PUT /api/mueble/:id_mueble → Mueble no encontrado", async () => {
    const res = await request(app)
      .put("/api/mueble/99999")
      .send({
        mueble: { nombre: "Mueble inexistente", precio: 100, stock: 1 },
        componentes: [],
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.mensaje).toBe("Mueble no encontrado");
  });
});
