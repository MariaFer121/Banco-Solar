const pg = require('pg');
const { Pool } = pg;

const config = {
    user: 'postgres',
    host: 'localhost',
    password: '1234',
    database: 'banco_solar',
    port: 5432,
    max: 20,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 2000,
};

const pool = new Pool(config);

async function nuevoUsuario(nombre, balance) {
    try {
        const client = await pool.connect();
        const { rows } = await client.query({
            text: `insert into usuarios (nombre, balance) values ($1,$2) returning *`,
            values: [nombre, balance],
        });
        client.release();
        return rows[0];
    } catch (error) {
        console.log("El error al ingresar al usuario es: " + error);
    }
}

async function getUsuarios() {
    try {
        const client = await pool.connect();
        const { rows } = await client.query(`select * from usuarios`);
        client.release();
        return rows;
    } catch (error) {
        console.log("El error al obtener el usuario es: " + error);
    }
}



async function editarUsuario(id, nombre, balance) {
    try {
        const client = await pool.connect();
        const { rows } = await client.query({
            text: 'update usuarios set nombre = $2, balance = $3 where id = $1',
            values: [parseInt(id), nombre, balance],
        });
        client.release()
        return rows

    } catch (error) {
        console.log("El error al editar al usuario es: " + error);
    }
}


async function eleminarUsuario(id) {
    try {
        const client = await pool.connect();
        await client.query({
            text: 'delete from transferencias where emisor=$1 or receptor =$1',
            values: [parseInt(id)]
        })
        await client.query({
            text: 'delete from usuarios where id = $1;',
            values: [parseInt(id)],
        });
        client.release();
    } catch (error) {
        console.log("El error al eliminar al usuario es: " + error);
    }

}

async function getTransferencias() {
    try {
        const client = await pool.connect();
        const { rows } = await client.query({
            text: `select transferencias.id, emisor.nombre, receptor.nombre as nombre1, transferencias.monto, transferencias.fecha
                    from transferencias join usuarios as emisor on transferencias.emisor = emisor.id
                    join usuarios as receptor on transferencias.receptor = receptor.id`,
            rowMode: "array"
        });
        console.log(rows)
        client.release();
        return rows;
    } catch (error) {
        console.log("El error al obtener la transferencia es: " + error);
    }

};

async function realizarTransferencia(nombre_emisor, nombre_receptor, monto) {
    try {

        const client = await pool.connect();
        let { rows } = await client.query({
            text: 'select * from usuarios where nombre=$1',
            values: [nombre_emisor]
        });
        const emisor = rows[0];

        const result = await client.query({
            text: 'select * from usuarios where nombre=$1',
            values: [nombre_receptor]
        });
        const receptor = result.rows[0];

        const monto_usuario = parseInt(monto);

        if (emisor.balance < monto_usuario) {
            throw "No tiene saldo suficiente para realizar la transferencia";
        }

        const resultado1 = emisor.balance - monto_usuario;
        await client.query({
            text: 'update usuarios set balance=$1 where id=$2',
            values: [resultado1, emisor.id]
        });

        const resultado2 = receptor.balance + monto_usuario;
        await client.query({
            text: 'update usuarios set balance=$1 where id=$2',
            values: [resultado2, receptor.id]
        });

        await client.query({
            text: "insert into transferencias (emisor, receptor, monto) values ($1, $2, $3)",
            values: [emisor.id, receptor.id, monto_usuario]
        });
        client.release();
        return result.rows;
    } catch (error) {
        console.log("El error al realizar la transferencia es: " + error);
    }

}



module.exports = { nuevoUsuario, getUsuarios, editarUsuario, eleminarUsuario, realizarTransferencia, getTransferencias }