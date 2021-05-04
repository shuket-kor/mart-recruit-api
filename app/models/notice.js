const logger = require('../config/logger.js');
const pool = require("../../app/config/database_dev");

module.exports = class notice {

    // noticeboard 전체 데이터
    static async list() {
        try {
            
            const [rows, fileds] = await pool.query(`SELECT SEQ, SUBJECT, CONTENT, USER_SEQ, CREATED, MODIFIED, ACTIVE
             FROM NOTICEBOARD LIMIT ? OFFSET ? ORDER BY SEQ DESC`, []); 
            return rows;
        } catch(error) {
            logger.writeLog(`[ERROR] models/notice/list:  + ${error}`);
            return null;
        };

    }
    // noticeViews 보기 데이터
    static async views(seq) {
        try {
            const[rows, fileds] = await pool.query(`SELECT SUBJECT, CONTENT, USER_SEQ, CREATED
             FROM NOTICEBOARD WHERE SEQ=?`, 
            [seq]);
            return rows[0];
        } catch(error) {
            logger.writeLog(`[ERROR] models/notice/Views:  + ${error}`);
            return null;
        }
    }

    // nitceboard 생성 데이터
    static async create(body) {
        try {
            console.log(body)
           console.log("크리에이트 모델 바디 : : :" + JSON.stringify(body));
            const [rows, fileds] = await pool.query(`INSERT INTO NOTICEBOARD (USER_SEQ, SUBJECT, CONTENT, ACTIVE) VALUES (?,?,?,'Y')`, 
            [
                body.USER_SEQ,
                body.SUBJECT,
                body.CONTENT
            ]); 
            return rows;
        } catch(error) {
            logger.writeLog(`[ERROR] models/notice/create:  + ${error}`);
            return null;
        };

    }

    // noticeboard 삭제 데이터
    static async remove(seq) {
        try {
            const [rows, fileds] = await pool.query(`UPDATE NOTICEBOARD SET ACTIVE='N' WHERE SEQ=?`, [seq]); 
            return rows;
        } catch(error) {
            logger.writeLog(`[ERROR] models/notice/delete:  + ${error}`);
            return null;
        };

    }

    // noticeboard 수정 데이터
    static async update(body) {
        try {
            const [rows, fileds] = await pool.query(`UPDATE NOTICEBOARD SET SUBJECT=?, CONTENT=?, USER_SEQ=?, MODIFIED=NOW() WHERE SEQ=?`, 
            [body.SUBJECT, body.CONTENT, body.USER_SEQ, body.SEQ]);
            return rows;
        } catch(error) {
            logger.writeLog(`[ERROR] models/notice/edit:  + ${error}`);
            return null;
        };

    }

    static async get(seq) {
        try 
        {
            const [rows, fields] = await pool.query(`SELECT SEQ, SUBJECT, CONTENT, USER_SEQ, CREATED, MODIFIED, ACTIVE FROM NOTICEBOARD WHERE SEQ=?`, [seq]);
            if (rows.length > 0) 
                return rows[0];
            else {
                logger.writeLog('error', `models/noticeModel.get: No data found`);           
                return null;
            }                
        } catch (error) {
            logger.writeLog('error', `models/noticeModel.get: ${error}`);           
            return null;
        }
    }
    //static async totalCount(seq) {
    static async totalCount() {
        try 
        {

            var query = `SELECT COUNT(SEQ) AS TOTALCOUNT FROM NOTICEBOARD WHERE ACTIVE='Y'`;
            //const [rows, fields] = await pool.query(query, [seq]);
            const [rows, fields] = await pool.query(query);
            logger.writeLog('error', `models/noticeModel.totalCount 요기: ${rows}`);   
            return rows[0].TOTALCOUNT;
        } catch (error) {
            logger.writeLog('error', `models/noticeModel.totalCount : ${error}`);           
            return 0;
        }
    }
    //static async list(name, limit, offset) {
    static async list(limit, offset) {
        try 
        {

            var query = `SELECT SEQ, SUBJECT, CONTENT, USER_SEQ, CREATED, MODIFIED, ACTIVE FROM NOTICEBOARD WHERE ACTIVE='Y' ORDER BY SEQ DESC LIMIT ? OFFSET ?`;
            const [rows, fields] = await pool.query(query, [limit, offset]);
            if (rows.length > 0) 
                return rows;
            else {
                logger.writeLog('error', `models/noticeModel.list: No data found`);           
                return null;
            }                
        } catch (error) {
            logger.writeLog('error', `models/noticeModel.list: ${error}`);           
            return null;
        }
    }

}

