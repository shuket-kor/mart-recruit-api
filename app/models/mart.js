const logger = require('../config/logger.js');
const pool = (process.env.NODE_ENV == "production") ? require("../config/database") : require("../config/database_dev");
const path = require('path');
const fs = require('fs');

module.exports = class martModel {
    static async create(userSeq, name, logoFile, regNo, postCode, address, addressExtra, contact, HROName, HROContact, HRORank) {
        try 
        {
            const [rows, fields] = await pool.query(`INSERT INTO MART (
                    USER_SEQ, NAME, LOGOFILE, REGNO, POSTCODE, ADDRESS, ADDRESSEXTRA, CONTACT, HRONAME, HROCONTACT, HRORANK, ACTIVE, CREATED, MODIFIED
                ) VALUES 
                ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'A', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())`, 
                [
                    userSeq, name, logoFile, regNo, postCode, address, addressExtra, contact, HROName, HROContact, HRORank
                ]);
            return rows.insertId;
        } catch (error) {
            logger.writeLog('error', `models/martModel.create: ${error}`);           
            return null;
        }
    }
    static async update(seq, name, regNo, postCode, address, addressExtra, contact, HROName, HROContact, HRORank) {
        try 
        {
            await pool.query(`UPDATE MART SET 
                    NAME=?, REGNO=?, POSTCODE=?, ADDRESS=?, ADDRESSEXTRA=?, CONTACT=?, HRONAME=?, HROCONTACT=?, HRORANK=?, MODIFIED=CURRENT_TIMESTAMP()
                WHERE 
                    SEQ=?`, 
                [
                    name, regNo, postCode, address, addressExtra, contact, HROName, HROContact, HRORank, seq
                ]);
            return seq;
        } catch (error) {
            logger.writeLog('error', `models/martModel.update: ${error}`);           
            return null;
        }
    }
    static async updateLogo(mediaPath, seq, logoFile) {
        console.log("logoFile ? ? ? ? " + logoFile);
        const connection = await pool.getConnection(async conn => conn);
        try 
        {
            await connection.beginTransaction();    // transaction

            // ?????? ????????? ????????? ??????
            const [rowsFind, fieldsFind] = await pool.query(`SELECT SEQ, LOCATION, FILENAME, RELATED_SEQ FROM FILESTORAGE WHERE RELATED_TABLE=? AND RELATED_SEQ=?`, ['MART', seq]);
            
            if (rowsFind.length > 0) {
                // ?????? ?????? ????????? ????????? ??????
                try {
                    fs.unlinkSync(mediaPath + "uploads/" + rowsFind[0].LOCATION + "/" + rowsFind[0].FILENAME);
                } catch {
                    console.log("?????? ?????? ??????");    
                }
                // ???????????? ??????
                await pool.query(`DELETE FROM FILESTORAGE WHERE SEQ=?`, [rowsFind[0].SEQ]);
            }
            // ????????? ?????? ?????? ????????? ??????
            console.log("dirname ? ? ? ? ? ? " + path.dirname(logoFile))
            console.log("basename ? ? ? ? ? ? " + path.basename(logoFile)) 
            // console.log(seq)
            const [rows, fields] = await pool.query(`INSERT INTO FILESTORAGE 
                (LOCATION, FILENAME, RELATED_TABLE, RELATED_SEQ) VALUES (?, ?, ?, ?)`, [path.dirname(logoFile), path.basename(logoFile), 'MART', seq]);
            // ?????? ????????? ?????? ?????? ?????? ??????

            await pool.query(`UPDATE MART SET LOGOFILE=?, MODIFIED=CURRENT_TIMESTAMP() WHERE SEQ=?`, [rows.insertId, seq]);

            await connection.commit(); // commit
            connection.release();

            return rows.insertId;
        } catch (error) {
            await connection.rollback();    // rollback
            connection.release();

            logger.writeLog('error', `models/martModel.updateLogo: ${error}`);           
            return null;
        }
    }
    static async remove(seq) {
        const connection = await pool.getConnection(async conn => conn);
        try 
        {
            await connection.beginTransaction();    // transaction

            await pool.query(`UPDATE MART SET ACTIVE='N' WHERE SEQ=?`, [seq]);
            await connection.query(`UPDATE USERS SET ACTIVE='N' WHERE SEQ = (SELECT USER_SEQ FROM MART WHERE SEQ = ?);`, [seq]);

            await connection.commit(); // commit
            connection.release();

            logger.writeLog('info', `models/martModel.remove: ${seq} ????????? ???????????????????????????.`);           
            return seq;
        } catch (error) {
            await connection.rollback();    // rollback
            connection.release();

            //????????? 0 ??????
            logger.writeLog('error', `models/martModel.remove: ${error}`);           
            return 0;
        }
    }
    static async get(seq) {
        try 
        {
            const [rows, fields] = await pool.query(`SELECT 
                    SEQ, USER_SEQ, NAME, LOGOFILE, REGNO, POSTCODE, ADDRESS, ADDRESSEXTRA, CONTACT, HRONAME, HROCONTACT, HRORANK, ACTIVE, CREATED, MODIFIED
                FROM 
                    MART 
                WHERE 
                    SEQ=?`, [seq]);
            if (rows.length > 0) 
                return rows[0];
            else {
                logger.writeLog('error', `models/martModel.get: No data found`);           
                return null;
            }                
        } catch (error) {
            logger.writeLog('error', `models/martModel.get: ${error}`);           
            return null;
        }
    }
    static async getByUser(userSeq) {
        try 
        {
            const [rows, fields] = await pool.query(`SELECT 
                    SEQ, USER_SEQ, NAME, LOGOFILE, REGNO, POSTCODE, ADDRESS, ADDRESSEXTRA, CONTACT, HRONAME, HROCONTACT, HRORANK, ACTIVE, CREATED, MODIFIED
                FROM 
                    MART 
                WHERE 
                USER_SEQ=?`, [userSeq]);
            if (rows.length > 0) 
                return rows[0];
            else {
                logger.writeLog('error', `models/martModel.getByUser: No data found`);           
                return null;
            }                
        } catch (error) {
            logger.writeLog('error', `models/martModel.getByUser: ${error}`);           
            return null;
        }
    }
    static async totalCount(name) {
        try 
        {
            //????????? ????????? ?????????
            const query = `SELECT COUNT(SEQ) AS TOTALCOUNT FROM MART WHERE ACTIVE='Y' ${(name && name != '') ? 'AND NAME LIKE \'%' + name + '%\'' : ''} `;
            const [rows, fields] = await pool.query(query);

            return rows[0].TOTALCOUNT;
        } catch (error) {
            logger.writeLog('error', `models/martModel.totalCount: ${error}`);           
            return 0;
        }
    }
    static async reactlist(seq, name, regno) {
        try {
            const query = `SELECT 
                                SEQ, USER_SEQ, NAME, LOGOFILE, REGNO, POSTCODE, ADDRESS, ADDRESSEXTRA, CONTACT, HRONAME, HROCONTACT, HRORANK, ACTIVE, CREATED, MODIFIED
                            FROM 
                                MART 
                            WHERE 
                                ACTIVE='Y'
                                ${(name) ? `AND NAME LIKE '%${name}%'`:''}
                                ${(regno) ? `AND REGNO LIKE '%${regno}%'`:''}  
                            ORDER BY 
                                NAME`;
            const [rows, fields] = await pool.query(query, []);
            if (rows.length > 0) 
                return rows;
            else {
                logger.writeLog('error', `models/martModel.reactlist: No data found`);           
                return null;
            }   
        } catch (error) {
            logger.writeLog('error', `modals/martModal.reactlist: ${error}`)
            return null;
        }
    }
    static async list(name, regno, limit, offset) {
        try 
        {
            //????????? ????????? ?????????
            const query = `SELECT 
                    SEQ, USER_SEQ, NAME, LOGOFILE, REGNO, POSTCODE, ADDRESS, ADDRESSEXTRA, CONTACT, HRONAME, HROCONTACT, HRORANK, ACTIVE, CREATED, MODIFIED
                FROM 
                    MART 
                WHERE 
                    ACTIVE='Y'
                    ${(name) ? `AND NAME LIKE '%${name}%'`:''}
                    ${(regno) ? `AND REGNO LIKE '%${regno}%'`:''}  
                ORDER BY 
                    NAME
                LIMIT ? OFFSET ?`;
            const [rows, fields] = await pool.query(query, [limit, offset]);
            if (rows.length > 0) 
                return rows;
            else {
                logger.writeLog('error', `models/martModel.list: No data found`);           
                return null;
            }                
        } catch (error) {
            logger.writeLog('error', `models/martModel.list: ${error}`);           
            return null;
        }
    }
    static async createJobRequest(martSeq, userSeq) {
        const connection = await pool.getConnection(async conn => conn);
        try 
        {
            await connection.beginTransaction();    // transaction
            //?????? ?????????. ????????? ???????????? ????????? ??????. ?????? ????????? ?????????
            await connection.query(`DELETE FROM MART_JOBREQUEST WHERE MART_SEQ=? AND USER_SEQ=?`, [martSeq, userSeq]);
            //??? ???????????? ????????????
            await connection.query(`INSERT INTO MART_JOBREQUEST (MART_SEQ, USER_SEQ, CREATED) VALUES (?, ?, CURRENT_TIMESTAMP())`, [martSeq, userSeq]);

            await connection.commit(); // commit
            connection.release();
            logger.writeLog('info', `models/martModel.createJobRequest: ????????? ${userSeq}??? ?????? ${martSeq}??? ?????? ?????? ??????????????????.`);           

            return martSeq;
        } catch (error) {
            await connection.rollback();    // rollback
            connection.release();

            logger.writeLog('error', `models/martModel.createJobRequest: ${error}`);           
            return null;
        }
    }
    static async getJobRequest(martSeq, userSeq) {
        try 
        {
            const [rows, fields] = await pool.query(`SELECT SEQ, USER_SEQ, MART_SEQ, CREATED FROM MART_JOBREQUEST WHERE MART_SEQ=? AND USER_SEQ=?`, [martSeq, userSeq]);

            if (rows.length > 0) 
                return rows;
            else {
                logger.writeLog('error', `models/martModel.getJobRequest: No data found`);           
                return null;
            }                
        } catch (error) {
            logger.writeLog('error', `models/martModel.getJobRequest: ${error}`);           
            return null;
        }
    }
    static async deleteJobRequest(martSeq, userSeq) {
        try 
        {
            await pool.query(`DELETE FROM MART_JOBREQUEST WHERE MART_SEQ=? AND USER_SEQ=?`, [martSeq, userSeq]);
            logger.writeLog('info', `models/martModel.deleteJobRequest: ????????? ${userSeq}??? ?????? ${martSeq}?????? ?????? ????????? ??????????????????.`);           

            return martSeq;
        } catch (error) {
            logger.writeLog('error', `models/martModel.deleteJobRequest: ${error}`);           
            return null;
        }
    }
    static async listJobRequest(userSeq) {
        try 
        {
            //????????? ????????? ?????????
            const query = `SELECT 
                    MART.SEQ, MART.USER_SEQ, NAME, LOGOFILE, REGNO, POSTCODE, ADDRESS, ADDRESSEXTRA, CONTACT, HRONAME, HROCONTACT, HRORANK, ACTIVE, MART.CREATED, MART.MODIFIED, MART_JOBREQUEST.CREATED AS MART_JOBREQUEST_CREATED
                FROM 
                    MART 
                    INNER JOIN MART_JOBREQUEST ON MART_JOBREQUEST.MART_SEQ = MART.SEQ
                WHERE 
                    ACTIVE='Y'
                    AND MART_JOBREQUEST.USER_SEQ = ?
                ORDER BY 
                    NAME`;
            const [rows, fields] = await pool.query(query, [userSeq]);
            if (rows.length > 0) 
                return rows;
            else {
                logger.writeLog('error', `models/martModel.listJobRequest: No data found`);           
                return null;
            }                
        } catch (error) {
            logger.writeLog('error', `models/martModel.listJobRequest: ${error}`);           
            return null;
        }
    }
    // ????????? ?????? ?????? ?????? ??????
    static async checkregno(bizNo) {
        // const connection = await pool.getConnection(async conn => conn);
        try {
            console.log('bizNo',bizNo);
            const query = `SELECT REGNO FROM MART WHERE REGNO = ?`;
            // await connection.beginTransaction();
            const [rows, fields] = await pool.query(query, [bizNo]);
            let checkRegno = new Object();
            checkRegno.tf = false;
            if(rows[0] === undefined) {
                checkRegno.tf = true; // ????????????
                return checkRegno;
            } else {
                checkRegno.tf = false; // ???????????????
                return checkRegno;
            }
        } catch (error) {
            logger.writeLog('error', `models/martModel.checkregno: ${error}`);           
            return null;
        }
    }
};