/*!
 * 
 *   深知开源知识模型全局地域选择
 * 
 */
var selectAreaId = 0;
function setPositioningz() {//地域初始化
    $('.czkj-positioning-determine').before('<span class="czkj-positioning-noselecttip">该地域不可选择</span>')
    let id = 2, areaName = '', areaLongName = '';//id是默认地域ID， 2是北京市
    selectAreaId = id;
    if(id == AreaInfo.areaId) {
        areaName = AreaInfo.name
        areaLongName = AreaInfo.longName
    }else {
        function seekAreaz(data) {
            data && data.forEach(function(item1) {
                if(item1.areaId == id) {
                    areaName = item1.name
                    areaLongName = item1.longName
                }else {
                    seekAreaz(item1.childAreaInfos)
                }
            })
        }
        seekAreaz(AreaInfo.childAreaInfos)
    }
    $('.positioning-text').text(areaName)

    function initPosition() {
        $('.czkj-positioning-modal-select').empty().hide()
        $('.czkj-positioning-modal-data').html('<span class="setAreaId" data-long="'+ AreaInfo.longName +'" data-id="'+ AreaInfo.areaId +'">'+ AreaInfo.name +'</span>');
        $('.czkj-positioning-modal-data .setAreaId:first-child').trigger('click');//默认触发第一级事件
        //初始化时回显选中状态
        
        if(selectAreaId != AreaInfo.areaId) {
            function seekAreaa(data) {
                data && data.forEach(function(item1) {
                    if(areaLongName === item1.longName) {
                        $('.czkj-positioning-modal-data .setAreaId[data-id="'+ item1.areaId +'"]').trigger('click');
                        return;
                    }else if(JSON.stringify(item1.childAreaInfos).includes(areaLongName)) {
                        $('.czkj-positioning-modal-data .setAreaId[data-id="'+ item1.areaId +'"]').trigger('click');
                        seekAreaa(item1.childAreaInfos)
                        return;
                    }
                })
            }
            seekAreaa(AreaInfo.childAreaInfos)
        }
    }

   
    //点击省市
    $('.czkj-robot-positioning-modal').off('click.d').on('click.d', '.setAreaId' ,function() {
        let selectId = $(this).data('id');
        if($(this).hasClass('active')) return;
        if($('.setAreaId.active').length) {
            $('.czkj-positioning-modal-select span:last-child').remove()
        }
        $('.czkj-positioning-modal-select').show().append('<span class="areaBack" data-long="'+ $(this).data('long') +'" data-id="'+ selectId +'">'+ $(this).text() +'</span>');
        $('.setAreaId.active').removeClass('active');
        if(selectId == AreaInfo.areaId) {
            
            let html1 = '';
            AreaInfo.childAreaInfos && AreaInfo.childAreaInfos.forEach(function(item) {
                html1 += '<span class="setAreaId" data-long="'+ item.longName +'" data-id="'+ item.areaId +'">'+ item.name +'</span>'
            })
            $('.czkj-positioning-modal-data').html(html1)
            if(!AreaInfo.enabled) {
                $('.czkj-positioning-determine').addClass('active');
                $('.czkj-positioning-noselecttip').show();
            }else {
                $('.czkj-positioning-determine').removeClass('active');
                $('.czkj-positioning-noselecttip').hide();
            }
            return
        }
        let dataz = '', enabled = false;
        function getChildAreaInfo(data) {
            data && data.forEach(function(item) {
                if(item.areaId == selectId) {
                    enabled = item.enabled
                    item.childAreaInfos && item.childAreaInfos.forEach(function(item) {
                        dataz += '<span class="setAreaId" data-long="'+ item.longName +'" data-id="'+ item.areaId +'">'+ item.name +'</span>'
                    })
                }else {
                    getChildAreaInfo(item.childAreaInfos)
                }
            })
        }
        getChildAreaInfo(AreaInfo.childAreaInfos, selectId)
        if(!dataz) {
            $(this).addClass('active');
            if(!enabled) {
                $('.czkj-positioning-determine').addClass('active');
                $('.czkj-positioning-noselecttip').show();
            }else {
                $('.czkj-positioning-determine').removeClass('active');
                $('.czkj-positioning-noselecttip').hide();
            }
            return
        }
        $('.czkj-positioning-modal-data').html(dataz);
        if(!enabled) {
            $('.czkj-positioning-determine').addClass('active');
            $('.czkj-positioning-noselecttip').show();
        }else {
            $('.czkj-positioning-determine').removeClass('active');
            $('.czkj-positioning-noselecttip').hide();
        }
        
    })

    initPosition()
    //点击省市返回
    $('.czkj-robot-positioning-modal').off('click.c').on('click.c', '.areaBack' ,function() {
        if($(this).index() === 0) {
            $(this).nextAll().remove()
            let html1 = '';
            AreaInfo.childAreaInfos && AreaInfo.childAreaInfos.forEach(function(item) {
                html1 += '<span class="setAreaId" data-long="'+ item.longName +'" data-id="'+ item.areaId +'">'+ item.name +'</span>'
            })
            $('.czkj-positioning-modal-data').html(html1);
            if(!AreaInfo.enabled) {
                $('.czkj-positioning-determine').addClass('active');
                $('.czkj-positioning-noselecttip').show();
            }else {
                $('.czkj-positioning-determine').removeClass('active');
                $('.czkj-positioning-noselecttip').hide();
            }
            return false;
        }
        if($(this).index() + 1 < $('.areaBack').length) {
            let selectId = $(this).data('id');
            let dataz = '', enabled = false;
            $(this).nextAll().remove()
            function getChildAreaInfo(data) {
                data && data.forEach(function(item) {
                    if(item.areaId == selectId) {
                        enabled = item.enabled;
                        item.childAreaInfos && item.childAreaInfos.forEach(function(item) {
                            dataz += '<span class="setAreaId" data-long="'+ item.longName +'" data-id="'+ item.areaId +'">'+ item.name +'</span>'
                        })
                    }else {
                        getChildAreaInfo(item.childAreaInfos)
                    }
                })
            }
            getChildAreaInfo(AreaInfo.childAreaInfos)
            $('.czkj-positioning-modal-data').html(dataz);
            if(!enabled) {
                $('.czkj-positioning-determine').addClass('active');
                $('.czkj-positioning-noselecttip').show();
            }else {
                $('.czkj-positioning-determine').removeClass('active');
                $('.czkj-positioning-noselecttip').hide();
            }
        }
    })
    //点击选择区域确定
    $('.czkj-robot-positioning-modal').off('click.e').on('click.e', '.czkj-positioning-determine' ,function() {
        if($(this).hasClass('active')) return;
        $('.czkj-robot-positioning-modal').hide();
        let infos = '';
        $('.czkj-positioning-modal-select span').each(function(index, item) {
            if(index + 1 === $('.czkj-positioning-modal-select span').length) {
                infos = item
            }
        })
        
        if(infos) {
            $('.positioning-text').text($(infos).text())
            
            $('.area-long-name').text($(infos).data('long'))
            $('.positioning-title').text('您当前选择的咨询地域为"'+ $(infos).text() +'"，如想咨询其他区域可点击修改')
            areaLongName = $(infos).data('long');
            selectAreaId = Number($(infos).data('id'));
        }
    })

    //显示选择区域弹窗
    $(document).off('click.a').on('click.a', '.czkj-logo-positioning, .positioning-area-set' ,function() {
        initPosition()
        $('.czkj-robot-positioning-modal').show();
    })
    //隐藏选择区域弹窗
    $(document).off('click.b').on('click.b', '.czkj-positioning-tools, .czkj-positioning-cancel' ,function() {
        $('.czkj-robot-positioning-modal').hide();
    })
}

