const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const connection = require('./config/database');

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;

const user = "machado.luandealmeida@gmail.com"; // Substitua pelo seu e-mail
const pass = "htob epun ysrq pgig"; // Substitua pela sua senha

app.get('/', (req, res) => res.send('Hello! World!'));

app.post('/send', async (req, res) => {
  const recipientEmail = req.body.recipientEmail;
  const { cliente, qtd, tipo_de_carga, origem, destino, selectedStatus, selectedInform, emailBody } = req.body;

  if (!recipientEmail) {
    return res.status(400).send('E-mail do destinatário ausente.');
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
      user,
      pass
    }
  });

  const subject = `Follow UP: ${selectedInform}`;

  try {
    // Verificar se o e-mail já foi enviado para o mesmo cliente
    const checkQuery = 'SELECT emailBody FROM EmailLog WHERE cliente = ? AND recipientEmail = ?';
    const checkValues = [cliente, recipientEmail];

    connection.query(checkQuery, checkValues, async (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Erro ao verificar o banco de dados:', checkErr);
        return res.status(500).send('Erro ao verificar o banco de dados.');
      }

      let updatedEmailBody = emailBody;

      if (checkResults.length > 0) {
        // Concatenar nova linha ao corpo do e-mail existente
        const previousEmailBody = checkResults[0].emailBody;
        const newLine = `
          <div class="continer">
            <div class="titulo-desc">Follow up atual</div>
            <div class="inform">
              <div class="lorem">${selectedInform}</div>
            </div>
          </div>
        `;

        // Encontrar o ponto de inserção da nova linha
        const insertionPoint = previousEmailBody.indexOf('</div></div>') + '</div></div>'.length;
        updatedEmailBody = previousEmailBody.slice(0, insertionPoint) + newLine + previousEmailBody.slice(insertionPoint);
      }

      // Enviar o e-mail com o corpo atualizado
      const info = await transporter.sendMail({
        from: user,
        to: recipientEmail,
        subject: subject,
        html: updatedEmailBody
      });

      if (checkResults.length > 0) {
        // Atualizar o registro existente
        const updateQuery = `UPDATE EmailLog 
                             SET qtd = ?, tipo_de_carga = ?, origem = ?, destino = ?, 
                                 selectedStatus = ?, selectedInform = ?, emailBody = ?
                             WHERE cliente = ? AND recipientEmail = ?`;
        const updateValues = [qtd, tipo_de_carga, origem, destino, selectedStatus, selectedInform, updatedEmailBody, cliente, recipientEmail];

        connection.query(updateQuery, updateValues, (updateErr, updateResults) => {
          if (updateErr) {
            console.error('Erro ao atualizar o banco de dados:', updateErr);
            return res.status(500).send('Erro ao atualizar o banco de dados.');
          }
          res.send(info);
          console.log("E-mail atualizado e enviado:", info);
        });
      } else {
        // Inserir um novo registro
        const insertQuery = `INSERT INTO EmailLog (cliente, qtd, tipo_de_carga, origem, destino, selectedStatus, selectedInform, emailBody, recipientEmail) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const insertValues = [cliente, qtd, tipo_de_carga, origem, destino, selectedStatus, selectedInform, updatedEmailBody, recipientEmail];

        connection.query(insertQuery, insertValues, (insertErr, insertResults) => {
          if (insertErr) {
            console.error('Erro ao salvar no banco de dados:', insertErr);
            return res.status(500).send('Erro ao salvar no banco de dados.');
          }
          res.send(info);
          console.log("E-mail enviado:", info);
        });
      }
    });
  } catch (error) {
    res.status(500).send(error);
    console.error("Erro ao enviar o e-mail:", error);
  }
});

app.get('/emails', (req, res) => {
  const query = 'SELECT * FROM EmailLog';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao consultar o banco de dados:', err);
      return res.status(500).send('Erro ao consultar o banco de dados.');
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
