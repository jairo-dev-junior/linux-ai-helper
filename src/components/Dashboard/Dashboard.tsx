import { useState, useEffect } from 'react';
import { getSystemData, SystemDiagnostic } from '../../api/SystemDataReceiver';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const [systemData, setSystemData] = useState<SystemDiagnostic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSystemData() {
      try {
        setLoading(true);
        const data = await getSystemData();
        setSystemData(data);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar dados do sistema');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadSystemData();
    // Atualizar dados a cada 5 segundos
    const interval = setInterval(loadSystemData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.watermark}></div>
        <div className={styles.loading}>Carregando dados do sistema...</div>
      </div>
    );
  }

  if (error || !systemData) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.watermark}></div>
        <div className={styles.error}>{error || 'Não foi possível carregar os dados do sistema'}</div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.watermark}></div>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <img src="/logo-app.png" alt="Logo" className={styles.logo} />
          <div>
            <h1 className={styles.title}>Dashboard do Sistema</h1>
            <p className={styles.subtitle}>{systemData.sistemaOperacional.hostname}</p>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Card de Memória */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Memória</h2>
            <span className={styles.percentage}>
              {systemData.memoria.percentualUsado.toFixed(1)}%
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${systemData.memoria.percentualUsado}%`,
                backgroundColor:
                  systemData.memoria.percentualUsado > 80
                    ? '#e03131'
                    : systemData.memoria.percentualUsado > 60
                    ? '#f59f00'
                    : '#51cf66',
              }}
            />
          </div>
          <div className={styles.cardDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Total:</span>
              <span className={styles.detailValue}>{systemData.memoria.total}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Usada:</span>
              <span className={styles.detailValue}>{systemData.memoria.usada}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Livre:</span>
              <span className={styles.detailValue}>{systemData.memoria.livre}</span>
            </div>
          </div>
        </div>

        {/* Card de CPU */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Processador</h2>
          </div>
          <div className={styles.cardDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Modelo:</span>
              <span className={styles.detailValue}>{systemData.processador.modelo}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Núcleos:</span>
              <span className={styles.detailValue}>{systemData.processador.numeroCPUs}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Velocidade:</span>
              <span className={styles.detailValue}>{systemData.processador.velocidadeMedia} MHz</span>
            </div>
          </div>
        </div>

        {/* Card de Sistema Operacional */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Sistema Operacional</h2>
          </div>
          <div className={styles.cardDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Plataforma:</span>
              <span className={styles.detailValue}>{systemData.sistemaOperacional.plataforma}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Versão:</span>
              <span className={styles.detailValue}>{systemData.sistemaOperacional.versao}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Arquitetura:</span>
              <span className={styles.detailValue}>{systemData.sistemaOperacional.arquitetura}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Kernel:</span>
              <span className={styles.detailValue}>{systemData.sistemaOperacional.release}</span>
            </div>
          </div>
        </div>

        {/* Card de Informações do Sistema */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Informações do Sistema</h2>
          </div>
          <div className={styles.cardDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Usuário:</span>
              <span className={styles.detailValue}>{systemData.sistema.usuario}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Tempo de Atividade:</span>
              <span className={styles.detailValue}>{systemData.sistema.tempoAtividade}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>IP Principal:</span>
              <span className={styles.detailValue}>{systemData.sistema.enderecoIP}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

