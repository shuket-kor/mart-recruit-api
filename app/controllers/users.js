const logger = require('../config/logger.js');
const userService = require("../services/users");
const { genSaltSync, hashSync, compareSync } = require("bcrypt");
const { sign } = require("jsonwebtoken");
const secretKey = require("../config/secretKey").secretKey;
const options = require("../config/secretKey").options;
const defaultRowCount = 20;
const { check, validationResult } = require('express-validator');

module.exports = {
    // 유저 생성
    async create(req, res, next) {
        try {
            await check('userId')
            .isLength({  max: 15 })
            .trim()
            .notEmpty()
            .run(req);
            await check('password')
            .isLength({  max: 10 })
            .trim()
            .notEmpty()
            .run(req);
            const result = validationResult(req);
            if (!result.isEmpty()) {
                res.json({
                    errors: result.array()
                });
                return;
            }
            let userId = req.body.userId;
            let password = req.body.password;
            let userType = req.body.userType;
            let bizNo = req.body.bizNo;
            let martName = req.body.martName;
            let active = req.body.active;

            // bcript 암호화
            let salt = genSaltSync(10);
            password = hashSync(password, salt);
            
            // 유저 생성
            let createUser = await userService.create(userId, password, userType, bizNo, martName, active);
            res.json({
                result: "success",
                data: createUser,
            });
        } catch (error) {
            return res.json({
                result: "fail",
                data: null,
            });
        }
    },

    // 로그인
    async login(req, res, next) {
        let userId = req.body.userId
        let password = req.body.password
        let userInfo = await userService.login(userId);
        if (!userInfo) {
            // 로그인이 실패했다
            logger.writeLog('info', `controller/login: 로그인 실패 (아이디 찾을 수 없음) ${userId} / ${password}`);
            return res.json({
                result: "fail",
                data: "Invalid ID or Password",
            });
        }
        // 암호화된 암호를 비교
        const result = compareSync(password, userInfo.PWD);
        if (result) {
            // 토큰 생성
            let accessToken = sign({ result: [userInfo.SEQ,userInfo.LOGINID, userInfo.USERTYPE] }, secretKey, options);
            logger.writeLog('info', `controller/login: 로그인 성공 ${userId} / ${accessToken}`);

            let returnJSON = {
                result: "success",
                data: {
                    SEQ: userInfo.SEQ,
                    LOGINID: userInfo.LOGINID,
                    USERTYPE: userInfo.USERTYPE,
                    token: accessToken
                }
            };
            return res.json(returnJSON);
        } else {
            logger.writeLog('info', `controller/login: 로그인 실패 (암호 매칭 실패) ${userId} / ${password}`);
            return res.json({
                result: "fail",
                data: "아이디 혹은 페스워드가 틀립니다.",
            });
        }
    },

    // 유저 전체조회
    async list(req,res, next){
        const page = (req.body.page) ? req.body.page : 1;
        const rowCount = (req.body.rowCount) ? req.body.rowCount  : defaultRowCount;
        const userType = req.body.userType;

        // 유저 로그인 아이디
        const userLoginId = (req.body.userLoginId) ? req.body.userLoginId : '';
        // 유저 전체조회 카운트
        const totalCount = await userService.count(req.body.userLoginId, userType);
        // 유저 리스트
        const list = await userService.list(userType, userLoginId, page, rowCount);
        
        return res.json({
            result: "success",
            data: {
                totalCount: totalCount,
                list: list,
            }
        });
    },

    async reactlist(req, res, next) {
        
        let seq = req.body.SEQ;
        let loginId = req.body.LOGINID;
        let userType = req.body.USERTYPE;

        const totalCount = (seq) ? 0 : await userService.totalCount(loginId, userType);
        console.log('totalCount ??',totalCount)
        const list = await userService.reactlist(seq, loginId, userType);

        res.status(200).json({
            result:'success',
            data: {
                totalCount: totalCount,
                list: list,
            }
        })  
    },
    
    // SEQ로 유저 한 명 조회
    async get(req, res, next) {
        const seq = req.body.seq;

        // 한명 유저 조회 결과
        const result = await userService.get(seq);

        let userId = result.LOGINID;
        let userInfo = await userService.login(userId);

        if (result) {
            res.status(200).json({
                result: 'success',
                data: result
            });    
        } else {
            res.status(200).json({
                result: 'fail',
                data: null
            });    
        }
    },

    async getUser(req, res, next) {
        const userId = req.body.userId;

        const result = await userService.getUser(userId);

        if (result) {
            res.status(200).json({
                result: 'success',
                data: result
            });    
        } else {
            res.status(200).json({
                result: 'fail',
                data: null
            });    
        }
    },

    // 유저 수정
    async update(req, res) {
        let userId = req.body.userId
        let password = req.body.password
        let userType = req.body.userType
        let active = req.body.active
        let seq = req.body.seq

        const salt = genSaltSync(10);
        password = hashSync(password, salt);
        let updateUser = await userService.update(userId, password, userType, active, seq);
        return res.json({
            result: "success",
            data: updateUser,
        });
    },

    // 유저 페스워드 수정
    async updatePassword(req, res) {
        let seq = req.body.seq
        let password = req.body.password

        const salt = genSaltSync(10);
        password = hashSync(password, salt);
        let result = await userService.updatePassword(seq, password);

        if (result) {
            res.status(200).json({
                result: 'success',
                data: result
            });    
        } else {
            res.status(200).json({
                result: 'fail',
                data: null
            });    
        }
    },

    // 유저 삭제
    async remove(req, res) {
        let seq = req.body.seq
        let removeUser = await userService.remove(seq);

        if (removeUser) {
            res.status(200).json({
                result: 'success',
                data: removeUser
            });    
        } else {
            res.status(200).json({
                result: 'fail',
                data: null
            });    
        }
    },

    // 아이디 중복 체크
    async checkid(req, res) {
        const userId = req.body.userId
        let checkIdUser = await userService.checkId(userId);
        
        if (checkIdUser) {
            res.status(200).json({
                result: 'success',
                data: checkIdUser
            });    
        } else {
            res.status(200).json({
                result: 'fail',
                data: null
            });    
        }
    },
    
    // 사업자등록번호 체크 api
    // async bizNoCheck(req, res) {
    //     const bizno = req.body.bodyData
    //     let checkBizno = await userService.bizNoCheck(bizno);
    //     return checkBizno
    //     res.json({
    //         result: "success",
    //         data: checkBizno,
    //     });
    // },
};
