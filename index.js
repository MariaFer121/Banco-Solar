const express = require('express');
const { nuevoUsuario, getUsuarios, editarUsuario, eleminarUsuario, getTransferencias, realizarTransferencia } = require('./db.js')
const app = express();


app.use(express.static('public'));


app.post('/usuario', async(req, res) => {
    try {
        let body = '';
        req.on('data', (data) => body += data)
        req.on('end', async() => {
            console.log(body)
            body = JSON.parse(body)
            await nuevoUsuario(body.nombre, body.balance)

        })
    } catch (error) {
        if (error.code == '23505') {
            return res.status(400).send({ mensaje: 'No puede ingresar nombre que ya esta registrado' })

        }
    }
    res.json({ todo: 'ok' })
});

app.get('/usuarios', async(req, res) => {
    try {
        const usuarios = await getUsuarios()
        res.json(usuarios)
    } catch (error) {
        if (error.code == '23502') {
            return res.status(400).send({ mensaje: 'Debe colocar un valor numerico en balance' })

        }
    }

});

app.put('/usuario', async(req, res) => {
    try {
        let body = '';
        req.on('data', (data) => body += data)
        req.on('end', async() => {
            console.log(body)
            body = JSON.parse(body)
            await editarUsuario(req.query.id, body.name, body.balance)
        })
    } catch (error) {
        if (error.code == '23503') {
            return res.status(400).send({ mensaje: 'No puede modificar un usuario que hizo una tranferencia' })

        }
        console.log(error)
    }
    res.json({ todo: 'ok' })

});
app.delete('/usuario', async(req, res) => {
    try {
        let id = req.query.id
        await eleminarUsuario(id)

    } catch (error) {
        if (error.code == '23503') {
            return res.status(400).send({ mensaje: 'No puede eliminar un usuario que hizo una tranferencia' })

        }
    }
    res.send({ todo: 'ok' })
})


app.get('/transferencias', async(req, res) => {
    try {
        let todasTransferencias = await getTransferencias();
        res.send(JSON.stringify(todasTransferencias));
    } catch (error) {
        if (error.code == '23502') {
            return res.status(400).send({ mensaje: 'Debe seleccionar un distinto emisor y receptor' })

        }
        console.log(error);
        res.send({ todo: 'ok' })
    }

});

app.post('/transferencia', async(req, res) => {
    let body = ""
    req.on("data", (data) => {
        body += data
    })

    req.on("end", async() => {
        try {
            const datos = JSON.parse(body);
            await realizarTransferencia(datos.emisor, datos.receptor, datos.monto);
            res.json({ datos });
        } catch (error) {
            console.log("El error al realizar la transferencia es: " + error);
            return res.status(400).send({ mensaje: 'Debe colocar un valor numerico en Monto' })

        }
    })
    res.send({ todo: 'ok' })
});

app.listen(3000, () => console.log('Servidor funcionando en puerto 3000'));