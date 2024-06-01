const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const connection = require('./config/database');
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();

const corsOptions = {
  origin: ['https://painel-transporthos.vercel.app', 'https://painel-transporthos.vercel.app/enviar-pdf', 'http://localhost:4200'], // Substitua pelo seu domínio frontend
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors());

app.use(bodyParser.json({ limit: '50mb' })); // Aumenta o limite do corpo da requisição para 50MB
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.json());

const port = 3000;

const user = "no-reply@transporthos.com.br"; 
const pass = "NO@!@reply152986"; 

// const user = "machado.luandealmeida@gmail.com"; // Substitua pelo seu e-mail
// const pass = "htob epun ysrq pgig"; // Substitua pela sua senha

app.get('/', (req, res) => res.send('Hello! World!'));

//app.post('/send', upload.array('attachments', 10), async (req, res) => {
app.post('/send', async (req, res) => {
  console.log(req.body);

  const recipientEmails = req.body.recipientEmail;
  const { cliente, cnpj, processo, di, tipo_de_carga, origem, destino, selectedInform, imagePreviews, clientesSelecionados } = req.body;
  const serializedImages = Buffer.from(JSON.stringify(imagePreviews.map(img => img.replace(/^data:image\/\w+;base64,/, ''))), 'base64');

  let ids = []

  for (const cliente of clientesSelecionados) {
    ids.push(cliente.id)
  }

  let idsString = ids.join(",");

  if (!recipientEmails || recipientEmails.length === 0) {
    return res.status(400).send('Nenhum destinatário especificado.');
  }



  const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: { user, pass },
    tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
  });

  const subject = `Follow UP - N° Processo: ${processo}`;

  try {
    // Aqui vamos iterar sobre todos os destinatários
    for (const recipientEmail of recipientEmails) {
      const checkQuery = 'SELECT emailBody FROM emailLog WHERE processo = ? AND recipientEmail = ?';
      const checkValues = [processo, recipientEmail];

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

      let newEmailSection = "";

      for (const cliente of clientesSelecionados) {
        newEmailSection += `
        <div class="container_inform_2">
        <div class="continer">
          <div class="inform" id="container-inform">
            <div class="lorem">${cliente.tipo_de_carga}</div>
          </div>
        </div>
        <div class="continer">
          <div class="inform" id="inicio-previsto">
            <div class="lorem">${cliente.inicioPrevisto} - ${cliente.hora}</div>
          </div>
        </div>
        <div class="continer">
          <div class="inform" id="conclusao-operacao">
            <div class="lorem">${cliente.conclusaoOperacao}</div>
          </div>
        </div>
        <div class="continer">
          <div class="inform" id="follow-up-atual">
            <div class="lorem">${cliente.selectedInform}</div>
          </div>
        </div>`;
      }



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
        let inform = '';

        inform += `
          <div class="container_inform_2">
              <div class="continer">
                  <div class="titulo-desc">Container</div>
              </div>
              <div class="continer">
                  <div class="titulo-desc">Inicio Previsto</div>
              </div>
              <div class="continer">
                  <div class="titulo-desc">Conclusão da operação</div>
              </div>
              <div class="continer">
                  <div class="titulo-desc">Follow up atual</div>
              </div>
          </div>
        
          `;
        for (const cliente of clientesSelecionados) {
          inform += `
            <div class="container_inform_2">
                <div class="continer">
                    <div class="inform">
                        <div class="lorem">${cliente.tipo_de_carga}</div>
                    </div>
                </div>
                <div class="continer">
                    <div class="inform">
                        <div class="lorem">${cliente.inicioPrevisto} - ${cliente.hora}</div>
                    </div>
                </div>
                <div class="continer">
                    <div class="inform">
                        <div class="lorem">${cliente.conclusaoOperacao}</div>
                    </div>
                </div>
                <div class="continer">
                    <div class="inform">
                        <div class="lorem">${cliente.selectedInform}</div>
                    </div>
                </div>
            </div>
          `;

        }

        updatedEmailBody = `
        <head>
        <meta charset="UTF-8">
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
          @media print {
            .inform-descr {
              background-color: #f8be8e !important;
              color: #000 !important;
            }
            .inform-cliente {
              background-color: rgba(217, 217, 217, 0.5) !important;
              color: #454d53 !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="container_principal">
          <header>
            <div class="logo">
              <img src="https://github.com/flaviopcsilva/painel-transporthos/blob/main/src/assets/transporthos.png?raw=true" alt="logo-img" width="100">
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
              </div>
              <div class="doc">
                <div class="processo">
                  <div class="inform-descr">Processo:</div>
                  <div class="inform-cliente">${processo}</div>
                </div>
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
          ${inform}
        </div>
      </body>`;
      }

      const attachments = imagePreviews.map((imageBase64, index) => ({
        filename: `image${index + 1}.jpg`,
        content: imageBase64.split(',')[1], // Remove o prefixo data:image/jpeg;base64,
        encoding: 'base64'
      }));

      const info = await transporter.sendMail({
        from: user,
        to: recipientEmail,
        subject: subject,
        html: updatedEmailBody,
        attachments: attachments
      });

      if (checkResults.length > 0) {
        const updateQuery = `UPDATE emailLog 
                             SET emailBody = ?, selectedInform = ?
                             WHERE processo = ? AND recipientEmail = ?`;
        const updateValues = [updatedEmailBody, selectedInform, processo, recipientEmail];

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
        const insertQuery = `INSERT INTO emailLog (cliente_id, emailBody, recipientEmail, cnpj, processo, di, tipo_de_carga, origem, destino, selectedInform, imagens) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const insertValues = [idsString, updatedEmailBody, recipientEmail, cnpj, processo, di, tipo_de_carga, origem, destino, selectedInform, serializedImages];

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
