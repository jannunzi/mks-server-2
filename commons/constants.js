const PREFIX = process.env.MKS_PREFIX || ''

const MNT = `${PREFIX}/mnt`;
const TMP = `${PREFIX}/tmp`;
const VAR = `${PREFIX}/var`;
const VERSIONS = `${PREFIX}/versions`;
const UPTIME = `${PREFIX}/proc/uptime`;

const FTP = `${VAR}/ftp`;
const FIRMWARE = `${FTP}/firmware`;
const LOG = `${FTP}/log`;

const MNT_CONFIG = `${MNT}/config`
const TMP_APPLY  = `${TMP}/apply`
const SCOPE_FILES = `${FTP}/scope`

module.exports = {
  PREFIX, MNT, TMP, VAR, VERSIONS, UPTIME, FTP,
  FIRMWARE, LOG, MNT_CONFIG, TMP_APPLY, SCOPE_FILES
}
