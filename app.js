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
  const recipientEmails = req.body.recipientEmail;
  const { id, cliente, cnpj, processo, di, data, hora, tipo_de_carga, origem, destino, selectedInform } = req.body;

  if (!recipientEmails || recipientEmails.length === 0) {
    return res.status(400).send('Nenhum destinatário especificado.');
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
    // Aqui vamos iterar sobre todos os destinatários
    for (const recipientEmail of recipientEmails) {
      const checkQuery = 'SELECT emailBody FROM EmailLog WHERE cliente_id = ? AND recipientEmail = ?';
      const checkValues = [id, recipientEmail];

      const checkResults = await new Promise((resolve, reject) => {
        connection.query(checkQuery, checkValues, (checkErr, checkResults) => {
          if (checkErr) {
            console.error('Erro ao verificar o banco de dados:', checkErr);
            reject('Erro ao verificar o banco de dados.');
          } else {
            resolve(checkResults);
          }
        });
      });

      let newEmailSection = `
        <div class="container_inform_2">
        <div class="continer">
          <div class="inform" id="container-inform">
            <div class="lorem">${tipo_de_carga}</div>
          </div>
        </div>
        <div class="continer">
          <div class="inform" id="inicio-previsto">
            <div class="lorem">${data} - ${hora}</div>
          </div>
        </div>
        <div class="continer">
          <div class="inform" id="conclusao-operacao">
            <div class="lorem">${data}</div>
          </div>
        </div>
        <div class="continer">
          <div class="inform" id="follow-up-atual">
            <div class="lorem">${selectedInform}</div>
          </div>
        </div>`;

      let updatedEmailBody;

      if (checkResults.length > 0) {
        const previousEmailBody = checkResults[0].emailBody;

        const insertionPoint = previousEmailBody.indexOf('</div></div></div>');

        if (insertionPoint !== -1) {
          updatedEmailBody = previousEmailBody.slice(0, insertionPoint) + newEmailSection + previousEmailBody.slice(insertionPoint);
        } else {
          updatedEmailBody = previousEmailBody + newEmailSection;
        }
      } else {
        updatedEmailBody = `
          <head>
            <style>
              /* Reset */
              :root {
                --color-text-inform: #000;
                --color-text: #454d53;
                --color-background: #d9d9d9;
                --color-inform: #f8be8e;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: sans-serif;
              }
              /* Header */
              header {
                overflow: hidden;
                padding: 10px;
                background-color: #fff;
              }
              header img {
                width: 100px;
                float: left;
              }
              header .titulo {
                padding-top: 20px;
                float: right;
                padding-right: 400px;
              }
              /* Conteúdo */
              .container_inform {
                margin: 2% 0;
                overflow: hidden;
              }
              .informs, .inform_2 {
                width: 50%;
                float: left;
                box-sizing: border-box;
              }
              .cliente_processo, .doc {
                background-color: #fff;
                border: 4px solid #fff;
                margin-bottom: 10px;
              }
              .cliente, .processo, .doc {
                overflow: hidden;
              }
              .inform-descr, .inform-cliente {
                width: 50%;
                box-sizing: border-box;
                float: left;
                text-align: center;
                margin-bottom: 7px;
              }
              .inform-descr {
                background-color: #f8be8e;
                padding: 5px 0;
              }
              .inform-cliente {
                padding: 5px 0;
                background-color: rgba(217, 217, 217, 0.5);
                color: #454d53;
              }
              /* Segundo Painel Informações */
              .container_inform_2 {
                background-color: #fff;
                overflow: hidden;
                border: 4px solid #fff;
              }
              .titulo-desc {
                padding: 2px;
                font-weight: bold;
                background-color: #f8be8e;
              }
              .continer {
                text-align: center;
                width: 25%;
                float: left;
                box-sizing: border-box;
              }
              .inform {
                margin-top: 10px;
              }
              .lorem {
                padding: 2px 0px;
                background-color: rgba(217, 217, 217, 0.5);
                color: #454d53;
              }
            </style>
          </head>
          <div class="container_principal">
            <header>
              <div class="logo">
                <img src="https://github.com/flaviopcsilva/painel-transporthos/blob/main/src/assets/transporthos.png?raw=true" alt="logo-img">
              </div>
              <div class="titulo">
                <h1>FOLLOW UP</h1>
              </div>
            </header>
            <div class="container_inform">
              <div class="informs">
                <div class="cliente_processo">
                  <div class="cliente">
                    <div class="inform-descr">Cliente:</div>
                    <div class="inform-cliente">${cliente}</div>
                  </div>
                  <div class="cnpj">
                    <div class="inform-descr">CNPJ:</div>
                    <div class="inform-cliente">${cnpj}</div>
                  </div>
                  <div class="processo">
                    <div class="inform-descr">Processo:</div>
                    <div class="inform-cliente">${processo}</div>
                  </div>
                </div>
                <div class="doc">
                  <div class="inform-descr">Documento:</div>
                  <div class="inform-cliente">${di}</div>
                </div>
              </div>
              <div class="inform_2">
                <div class="cliente_processo">
                  <div class="cliente">
                    <div class="inform-descr">Origem:</div>
                    <div class="inform-cliente">${origem}</div>
                  </div>
                  <div class="processo">
                    <div class="inform-descr">Destino:</div>
                    <div class="inform-cliente">${destino}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="container_inform_2">
              <div class="continer">
                <div class="titulo-desc">Container</div>
                <div class="inform">
                  <div class="lorem">${tipo_de_carga}</div>
                </div>
              </div>
              <div class="continer">
                <div class="titulo-desc">Inicio Previsto</div>
                <div class="inform">
                  <div class="lorem">${data} - ${hora}</div>
                </div>
              </div>
              <div class="continer">
                <div class="titulo-desc">Conclusão da operação</div>
                <div class="inform">
                  <div class="lorem">${data}</div>
                </div>
              </div>
              <div class="continer">
                <div class="titulo-desc">Follow up atual</div>
                <div class="inform">
                  <div class="lorem">${selectedInform}</div>
                </div>
              </div>
            </div>
          </div>`;
      }

      const info = await transporter.sendMail({
        from: user,
        to: recipientEmail,
        subject: subject,
        html: updatedEmailBody
      });

      if (checkResults.length > 0) {
        const updateQuery = `UPDATE EmailLog 
                             SET emailBody = ?
                             WHERE cliente_id = ? AND recipientEmail = ?`;
        const updateValues = [updatedEmailBody, id, recipientEmail];

        await new Promise((resolve, reject) => {
          connection.query(updateQuery, updateValues, (updateErr, updateResults) => {
            if (updateErr) {
              console.error('Erro ao atualizar o banco de dados:', updateErr);
              reject('Erro ao atualizar o banco de dados.');
            } else {
              console.log("E-mail atualizado e enviado:", info);
              resolve();
            }
          });
        });
      } else {
        const insertQuery = `INSERT INTO EmailLog (cliente_id, emailBody, recipientEmail) 
                             VALUES (?, ?, ?)`;
        const insertValues = [id, updatedEmailBody, recipientEmail];

        await new Promise((resolve, reject) => {
          connection.query(insertQuery, insertValues, (insertErr, insertResults) => {
            if (insertErr) {
              console.error('Erro ao inserir no banco de dados:', insertErr);
              reject('Erro ao inserir no banco de dados.');
            } else {
              console.log("E-mail enviado e registrado com sucesso:", info);
              resolve();
            }
          });
        });
      }
    }
    // Enviar uma resposta após o término do loop
    res.status(200).send();
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error);
    res.status(500).send('Erro ao enviar o e-mail.');
  }
});



app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
